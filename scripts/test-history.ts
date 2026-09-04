import * as https from "node:https";
import * as zlib from "node:zlib";
import { Buffer } from "node:buffer";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const REPO_OWNER = "florentin-one-cloud";
const REPO_NAME = "mcp";
const WORKFLOW_FILE = "test.yml";
const MAX_RUNS = 20;

const API_HOST = "api.github.com";
const USER_AGENT = "florentin-one-test-history/1.0";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  html_url: string;
}

interface GitHubArtifact {
  id: number;
  name: string;
  archive_download_url: string;
  expired: boolean;
}

interface VitestTestResult {
  name: string;
  status: string;
  failureMessages: string[];
}

interface VitestReport {
  numTotalTests: number;
  numFailedTests: number;
  testResults: VitestTestResult[];
}

interface FailureEntry {
  testName: string;
  count: number;
}

interface RunSummary {
  runId: number;
  runName: string;
  conclusion: string | null;
  createdAt: string;
  failures: VitestTestResult[];
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function apiRequest(
  method: string,
  apiPath: string,
  opts?: { accept?: string }
): Promise<{ status: number; data: Buffer; headers: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      "User-Agent": USER_AGENT,
      Accept: opts?.accept ?? "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    if (GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
    }

    const req = https.request(
      {
        hostname: API_HOST,
        path: apiPath,
        method,
        headers
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 500,
            data: Buffer.concat(chunks),
            headers: res.headers as Record<string, string>
          });
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(30_000, () => {
      req.destroy(new Error("Request timed out"));
    });
    req.end();
  });
}

async function apiRequestJson<T>(apiPath: string): Promise<T> {
  const { status, data } = await apiRequest("GET", apiPath);

  if (status === 403 || status === 429) {
    const body = data.toString();
    if (body.includes("rate limit") || body.includes("secondary rate limit")) {
      console.error(
        "Rate limited by GitHub API. Set GITHUB_TOKEN environment variable for higher limits (5,000 req/hr vs 60 req/hr)."
      );
      process.exit(1);
    }
  }

  if (status === 404) {
    throw new Error(`Not found: ${apiPath}`);
  }

  if (status < 200 || status >= 300) {
    throw new Error(`GitHub API error ${status} for ${apiPath}: ${data.toString().slice(0, 200)}`);
  }

  return JSON.parse(data.toString()) as T;
}

async function downloadWithRedirect(url: string): Promise<Buffer> {
  let currentUrl = url;
  for (let i = 0; i < 5; i++) {
    const urlObj = new URL(currentUrl);
    const isApiRequest = urlObj.hostname === API_HOST;

    const { status, data, headers } = await new Promise<{
      status: number;
      data: Buffer;
      headers: Record<string, string>;
    }>((resolve, reject) => {
      const reqHeaders: Record<string, string> = {
        "User-Agent": USER_AGENT
      };
      if (isApiRequest && GITHUB_TOKEN) {
        reqHeaders["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
      }

      const req = https.request(
        {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: "GET",
          headers: reqHeaders
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            resolve({
              status: res.statusCode ?? 500,
              data: Buffer.concat(chunks),
              headers: res.headers as Record<string, string>
            });
          });
        }
      );
      req.on("error", reject);
      req.setTimeout(60_000, () => {
        req.destroy(new Error("Download timed out"));
      });
      req.end();
    });

    if (status >= 300 && status < 400 && headers["location"]) {
      currentUrl = headers["location"];
      continue;
    }

    if (status === 403 || status === 401) {
      throw new Error(
        `Artifact download requires authentication. Set GITHUB_TOKEN environment variable. (status ${status})`
      );
    }

    if (status < 200 || status >= 300) {
      throw new Error(`Download failed with status ${status}`);
    }

    return data;
  }
  throw new Error("Too many redirects");
}

// ---------------------------------------------------------------------------
// Minimal ZIP extraction (no external dependencies)
// ---------------------------------------------------------------------------

function extractJsonFilesFromZip(zipBuffer: Buffer): Map<string, Buffer> {
  const result = new Map<string, Buffer>();

  const EOCD_SIG = 0x06054b50;
  let eocdOffset = -1;
  const searchStart = Math.max(0, zipBuffer.length - 65557);
  for (let i = zipBuffer.length - 22; i >= searchStart; i--) {
    if (zipBuffer.readUInt32LE(i) === EOCD_SIG) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) return result;

  const centralDirOffset = zipBuffer.readUInt32LE(eocdOffset + 16);
  let offset = centralDirOffset;

  while (offset < zipBuffer.length - 4) {
    const sig = zipBuffer.readUInt32LE(offset);
    if (sig !== 0x02014b50) break;

    const compressionMethod = zipBuffer.readUInt16LE(offset + 10);
    const compressedSize = zipBuffer.readUInt32LE(offset + 20);
    const fileNameLen = zipBuffer.readUInt16LE(offset + 28);
    const extraFieldLen = zipBuffer.readUInt16LE(offset + 30);
    const commentLen = zipBuffer.readUInt16LE(offset + 32);
    const localHeaderOffset = zipBuffer.readUInt32LE(offset + 42);

    const fileName = zipBuffer.toString("utf8", offset + 46, offset + 46 + fileNameLen);

    if (fileName.endsWith(".json")) {
      const localSig = zipBuffer.readUInt32LE(localHeaderOffset);
      if (localSig !== 0x04034b50) {
        offset += 46 + fileNameLen + extraFieldLen + commentLen;
        continue;
      }

      const localFileNameLen = zipBuffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraFieldLen = zipBuffer.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localFileNameLen + localExtraFieldLen;

      const compressedData = zipBuffer.subarray(dataOffset, dataOffset + compressedSize);

      let decompressed: Buffer;
      if (compressionMethod === 0) {
        decompressed = compressedData;
      } else if (compressionMethod === 8) {
        decompressed = zlib.inflateRawSync(compressedData);
      } else {
        offset += 46 + fileNameLen + extraFieldLen + commentLen;
        continue;
      }

      result.set(fileName, decompressed);
    }

    offset += 46 + fileNameLen + extraFieldLen + commentLen;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("=== Test Failure History (last 20 runs) ===\n");

  // 1. Fetch workflow runs
  let runs: GitHubWorkflowRun[];
  try {
    const response = await apiRequestJson<{ workflow_runs: GitHubWorkflowRun[] }>(
      `/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?workflow_id=${WORKFLOW_FILE}&per_page=${MAX_RUNS}`
    );
    runs = response.workflow_runs;
  } catch (err) {
    if (err instanceof Error && err.message.includes("Not found")) {
      console.error(`Workflow "${WORKFLOW_FILE}" not found. Ensure test.yml exists in .github/workflows/.`);
      process.exit(1);
    }
    throw err;
  }

  if (runs.length === 0) {
    console.log("No workflow runs found for test.yml.");
    console.log("\nSummary:");
    console.log("  Total runs analyzed: 0");
    console.log("  Runs with failures: 0");
    console.log("  Unique failing tests: 0");
    return;
  }

  // 2. For each run, fetch artifacts and extract test reports
  const runSummaries: RunSummary[] = [];
  const failureCounts = new Map<string, number>();

  for (const run of runs) {
    const runSummary: RunSummary = {
      runId: run.id,
      runName: run.name,
      conclusion: run.conclusion,
      createdAt: run.created_at,
      failures: []
    };

    if (run.status !== "completed") {
      runSummaries.push(runSummary);
      continue;
    }

    try {
      const artifactsResponse = await apiRequestJson<{ artifacts: GitHubArtifact[] }>(
        `/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${run.id}/artifacts`
      );

      const testArtifacts = artifactsResponse.artifacts.filter(
        (a) =>
          !a.expired &&
          (a.name.startsWith("test-report-unit-") ||
            a.name.startsWith("test-report-integration-") ||
            a.name.startsWith("test-report-e2e-"))
      );

      for (const artifact of testArtifacts) {
        try {
          const zipBuffer = await downloadWithRedirect(artifact.archive_download_url);
          const jsonFiles = extractJsonFilesFromZip(zipBuffer);

          for (const [, jsonBuffer] of jsonFiles) {
            try {
              const report: VitestReport = JSON.parse(jsonBuffer.toString());
              for (const testResult of report.testResults) {
                if (testResult.status === "failed") {
                  runSummary.failures.push(testResult);
                  const current = failureCounts.get(testResult.name) ?? 0;
                  failureCounts.set(testResult.name, current + 1);
                }
              }
            } catch {
              // Skip invalid JSON within artifact
            }
          }
        } catch {
          // Skip failed artifact downloads (e.g., missing GITHUB_TOKEN)
        }
      }
    } catch {
      // Skip runs where artifact listing fails
    }

    runSummaries.push(runSummary);
  }

  // 3. Output
  const sortedFailures: FailureEntry[] = Array.from(failureCounts.entries())
    .map(([testName, count]) => ({ testName, count }))
    .sort((a, b) => b.count - a.count);

  if (sortedFailures.length > 0) {
    console.log("Recurring Failures (sorted by frequency):");
    for (const entry of sortedFailures) {
      console.log(`  ${entry.count}x  ${entry.testName}`);
    }
    console.log();
  } else {
    console.log("No recurring failures found.\n");
  }

  const runsWithFailures = runSummaries.filter((r) => r.failures.length > 0).length;
  const uniqueFailingTests = failureCounts.size;
  const mostFrequent = sortedFailures[0];

  console.log("Summary:");
  console.log(`  Total runs analyzed: ${runs.length}`);
  console.log(`  Runs with failures: ${runsWithFailures}`);
  console.log(`  Unique failing tests: ${uniqueFailingTests}`);
  if (mostFrequent) {
    const fileName = mostFrequent.testName.split(" > ")[0] ?? mostFrequent.testName;
    const shortName = fileName.split("/").pop() ?? fileName;
    console.log(`  Most frequent failure: ${shortName} (${mostFrequent.count} occurrences)`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err instanceof Error ? err.message : err);
  process.exit(1);
});