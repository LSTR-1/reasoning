#!/usr/bin/env node

/**
 * test-cleanup.ts — Detect orphaned test files whose imported source modules no longer exist.
 *
 * Scans all __tests__/ directories under src/, parses relative import statements,
 * resolves them to absolute paths, and flags test files that import non-existent modules.
 *
 * Usage: npx tsx scripts/test-cleanup.ts
 *
 * Exit code: always 0 (never blocks CI).
 * Warnings: printed to stderr for CI annotation compatibility.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { realpathSync, existsSync, Dirent } from "node:fs";
import * as path from "node:path";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrphanedImport {
  /** Absolute path of the test file */
  testFile: string;
  /** The raw import specifier from the source (e.g. "./foo.js") */
  importPath: string;
  /** The absolute path that was resolved but does not exist */
  resolvedPath: string;
  /** 1-based line number where the import was found */
  line: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WORKSPACE_ROOT = path.resolve(import.meta.dirname, "..");
const SRC_ROOT = path.join(WORKSPACE_ROOT, "src");

/** Regex matching static import specifiers: import ... from "..."  or  import "..." */
const STATIC_IMPORT_RE =
  /import\s+(?:type\s+)?(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*,?\s*(?:\{[^}]*\})?\s+from\s+)?["']([^"']+)["']/g;

/** Regex matching dynamic import specifiers: import("...") */
const DYNAMIC_IMPORT_RE = /import\s*\(\s*["']([^"']+)["']\s*\)/g;

/** Regex matching re-export specifiers: export ... from "..." */
const RE_EXPORT_RE = /export\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\*)\s+from\s+["']([^"']+)["']/g;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Recursively find all directories named `__tests__` under `root`.
 */
async function findTestDirs(root: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string): Promise<void> {
    let entries: Dirent<string>[];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      // Directory unreadable — skip
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === "node_modules") continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.name === "__tests__") {
        results.push(fullPath);
      } else {
        await walk(fullPath);
      }
    }
  }

  await walk(root);
  return results;
}

/**
 * Recursively find all `.ts` and `.tsx` files under a directory.
 */
async function findTsFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(current: string): Promise<void> {
    let entries: Dirent<string>[];
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules") {
          await walk(fullPath);
        }
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }

  await walk(dir);
  return results;
}

/**
 * Extract all relative import specifiers from file content.
 * Returns tuples of [specifier, lineNumber].
 */
function extractRelativeImports(content: string): Array<{ specifier: string; line: number }> {
  const results: Array<{ specifier: string; line: number }> = [];
  const lines = content.split("\n");

  const allRegexes = [STATIC_IMPORT_RE, DYNAMIC_IMPORT_RE, RE_EXPORT_RE];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const regex of allRegexes) {
      // Reset lastIndex for global regex
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line)) !== null) {
        const specifier = match[1];
        if (specifier.startsWith("./") || specifier.startsWith("../")) {
          results.push({ specifier, line: i + 1 });
        }
      }
    }
  }

  return results;
}

/**
 * Resolve a relative import specifier to an absolute file path.
 * Handles .js → .ts conversion (project uses .js in imports but files are .ts).
 * Returns the resolved absolute path, or null if resolution fails.
 */
function resolveImportPath(importSpecifier: string, fromDir: string): string | null {
  // Resolve the raw specifier relative to the test file's directory
  let candidate = path.resolve(fromDir, importSpecifier);

  // Normalize symlinks
  try {
    candidate = realpathSync(candidate);
  } catch {
    // Path doesn't exist yet — continue with the unresolved path
  }

  // Try candidates in order
  const candidates = [
    candidate, // exact path
    candidate + ".ts", // append .ts
    candidate + ".tsx", // append .tsx
    candidate.replace(/\.js$/, ".ts"), // .js → .ts
    candidate.replace(/\.js$/, ".tsx"), // .js → .tsx
    path.join(candidate, "index.ts"), // directory index
    path.join(candidate, "index.tsx"), // directory index tsx
  ];

  // Also try .js→.ts replacement on the unresolved path (before realpath)
  const unresolved = path.resolve(fromDir, importSpecifier);
  if (unresolved !== candidate) {
    candidates.push(
      unresolved.replace(/\.js$/, ".ts"),
      unresolved.replace(/\.js$/, ".tsx"),
    );
  }

  for (const c of candidates) {
    if (existsSync(c)) {
      try {
        return realpathSync(c);
      } catch {
        return c;
      }
    }
  }

  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // 1. Find all __tests__ directories
  let testDirs: string[] = [];
  try {
    testDirs = await findTestDirs(SRC_ROOT);
  } catch (err) {
    console.error(`[test-cleanup] Error scanning for __tests__ directories: ${String(err)}`);
    process.exit(0);
  }

  if (testDirs.length === 0) {
    // No __tests__ directories — nothing to do
    process.exit(0);
  }

  // 2. Collect all test files
  const testFiles: string[] = [];
  for (const dir of testDirs) {
    const files = await findTsFiles(dir);
    testFiles.push(...files);
  }

  if (testFiles.length === 0) {
    process.exit(0);
  }

  // 3. Analyze each test file
  const orphans: OrphanedImport[] = [];

  for (const testFile of testFiles) {
    let content: string;
    try {
      content = await readFile(testFile, "utf-8");
    } catch {
      console.error(`[test-cleanup] Cannot read test file: ${testFile}`);
      continue;
    }

    const imports = extractRelativeImports(content);
    if (imports.length === 0) continue;

    const testDir = path.dirname(testFile);

    for (const { specifier, line } of imports) {
      const resolved = resolveImportPath(specifier, testDir);
      if (resolved === null) {
        orphans.push({
          testFile,
          importPath: specifier,
          resolvedPath: path.resolve(testDir, specifier),
          line,
        });
      }
    }
  }

  // 4. Output report
  if (orphans.length === 0) {
    console.log("0 orphaned tests found");
  } else {
    for (const orphan of orphans) {
      const relativeTest = path.relative(WORKSPACE_ROOT, orphan.testFile);
      console.error(
        `[test-cleanup] ORPHANED: ${relativeTest}:${orphan.line} — missing import "${orphan.importPath}" (resolved: ${orphan.resolvedPath})`,
      );
    }
    // Summary to stdout
    console.log(`${orphans.length} orphaned test file(s) found`);
  }

  // Always exit 0
  process.exit(0);
}

main().catch((err) => {
  console.error(`[test-cleanup] Unexpected error: ${String(err)}`);
  process.exit(0);
});