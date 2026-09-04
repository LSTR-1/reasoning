import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock ExecutionContext
// ---------------------------------------------------------------------------

export interface MockExecutionContext {
  waitUntil: ReturnType<typeof vi.fn>;
  passThroughOnException: ReturnType<typeof vi.fn>;
  props: Record<string, unknown>;
}

/**
 * Creates a mock ExecutionContext for Cloudflare Workers testing.
 * The `props` field carries arbitrary context data (configurable via input).
 */
export function createMockExecutionContext(props?: Record<string, unknown>): MockExecutionContext {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
    props: props ?? {}
  };
}

// ---------------------------------------------------------------------------
// Mock Env (KV, R2, D1)
// ---------------------------------------------------------------------------

export interface MockKVNamespace {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
}

export interface MockR2Bucket {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
}

export interface MockD1Database {
  prepare: ReturnType<typeof vi.fn>;
  bind: ReturnType<typeof vi.fn>;
  run: ReturnType<typeof vi.fn>;
  first: ReturnType<typeof vi.fn>;
  all: ReturnType<typeof vi.fn>;
}

export interface MockEnv {
  KV: MockKVNamespace;
  R2: MockR2Bucket;
  DB: MockD1Database;
  [key: string]: unknown;
}

/**
 * Creates a mock Env object with configurable KV, R2, and D1 bindings.
 * Additional bindings are merged via the `bindings` parameter.
 */
export function createMockEnv(bindings?: Record<string, unknown>): MockEnv {
  const kv: MockKVNamespace = {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  };

  const r2: MockR2Bucket = {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  };

  const d1: MockD1Database = {
    prepare: vi.fn(),
    bind: vi.fn(),
    run: vi.fn(),
    first: vi.fn(),
    all: vi.fn()
  };

  return {
    KV: kv,
    R2: r2,
    DB: d1,
    ...bindings
  };
}

// ---------------------------------------------------------------------------
// MCP Response Assertion
// ---------------------------------------------------------------------------

/**
 * Validates that a response matches the MCP protocol shape:
 * - Has a `content` array
 * - Each content item has `type: "text"` and `text: string`
 *
 * Returns the parsed JSON from the first text content item.
 * Throws if the response does not conform.
 */
export function assertMCPResponse(response: unknown): unknown {
  if (typeof response !== "object" || response === null) {
    throw new Error("Expected response to be an object");
  }

  const r = response as Record<string, unknown>;

  if (!Array.isArray(r.content)) {
    throw new Error("Expected response to have a 'content' array");
  }

  if (r.content.length === 0) {
    throw new Error("Expected response content array to be non-empty");
  }

  for (const item of r.content) {
    if (typeof item !== "object" || item === null) {
      throw new Error("Expected each content item to be an object");
    }
    const contentItem = item as Record<string, unknown>;
    if (contentItem.type !== "text") {
      throw new Error(`Expected content item type to be "text", got "${String(contentItem.type)}"`);
    }
    if (typeof contentItem.text !== "string") {
      throw new Error("Expected content item text to be a string");
    }
  }

  const firstItem = r.content[0] as Record<string, unknown>;
  return JSON.parse(firstItem.text as string);
}

// ---------------------------------------------------------------------------
// Generic Test Fixture Factory
// ---------------------------------------------------------------------------

/**
 * Generic fixture factory.
 * Returns a function that accepts optional partial overrides and merges them
 * with the defaults.
 *
 * @example
 * const userFixture = createTestFixture({ name: "default", age: 0 });
 * const user = userFixture({ name: "Alice" }); // { name: "Alice", age: 0 }
 */
export function createTestFixture<T extends Record<string, unknown>>(defaults: T) {
  return (overrides?: Partial<T> & Record<string, unknown>): T => {
    if (!overrides) return { ...defaults };
    return { ...defaults, ...overrides } as T;
  };
}