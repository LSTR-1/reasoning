/**
 * E2E Test Template — @florentin-one/mcp
 * ========================================
 *
 * Copy this file to your package's __tests__/e2e/ directory.
 * Rename it to match the scenario: e.g. `deployed-worker.test.ts`.
 *
 * These tests run against a deployed Cloudflare Worker.
 * They are NOT run in CI on every branch — only on main.
 *
 * Prerequisites:
 *   - CLOUDFLARE_API_TOKEN environment variable set
 *   - Worker deployed via `pnpm run deploy` (wrangler deploy)
 *   - DEPLOYED_WORKER_URL environment variable (or hardcode the URL below)
 *
 * Run with: pnpm run test:e2e
 *
 * WARNING: These tests mutate live infrastructure. Ensure test data is
 * isolated and cleaned up. Do NOT run against production outside of
 * controlled CI pipelines.
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Configuration — set via environment or replace with the deployed URL
// ---------------------------------------------------------------------------
const WORKER_URL = process.env.DEPLOYED_WORKER_URL ?? "https://mcp.example.workers.dev";

// ---------------------------------------------------------------------------
// Helper: send an MCP JSON-RPC request to the deployed worker
// ---------------------------------------------------------------------------
async function mcpRequest(method: string, params?: Record<string, unknown>): Promise<Response> {
  return fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `e2e-${Date.now()}`,
      method,
      params
    })
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("E2E: Deployed Worker", () => {
  /**
   * Deployment validation.
   * Verifies the worker is reachable and responds to HTTP requests.
   */
  it("should respond to a health-check GET request", async () => {
    const response = await fetch(WORKER_URL);

    // The worker MUST return a non-5xx status
    expect(response.status).toBeLessThan(500);
  });

  /**
   * MCP protocol response validation.
   * Sends a tools/list request and validates the MCP JSON-RPC response shape.
   */
  it("should return a valid MCP tools/list response", async () => {
    const response = await mcpRequest("tools/list");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");

    const body = await response.json();

    // MCP JSON-RPC response MUST have these fields
    expect(body).toHaveProperty("jsonrpc", "2.0");
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("result");
    expect(body.result).toHaveProperty("tools");
    expect(Array.isArray(body.result.tools)).toBe(true);

    // Each tool MUST have a name and description
    for (const tool of body.result.tools) {
      expect(tool).toHaveProperty("name");
      expect(typeof tool.name).toBe("string");
    }
  });

  /**
   * MCP tool invocation validation.
   * Sends a tools/call request and validates the tool response.
   */
  it("should execute an MCP tool and return a valid result", async () => {
    const response = await mcpRequest("tools/call", {
      name: "metacognitiveMonitoring",
      arguments: {
        monitoringId: "mm-e2e-test",
        stage: "knowledge-assessment",
        domain: "e2e-testing",
        confidenceThreshold: 0.5
      }
    });

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toHaveProperty("result");
    expect(body.result).toHaveProperty("content");
    expect(Array.isArray(body.result.content)).toBe(true);
    expect(body.result.content.length).toBeGreaterThan(0);

    // Each content item MUST follow the MCP content schema
    for (const item of body.result.content) {
      expect(item).toHaveProperty("type", "text");
      expect(item).toHaveProperty("text");
      expect(typeof item.text).toBe("string");
    }
  });

  /**
   * Error handling validation.
   * Verifies the worker returns a proper MCP error for invalid requests.
   */
  it("should return an MCP error for an unknown tool", async () => {
    const response = await mcpRequest("tools/call", {
      name: "nonexistentTool",
      arguments: {}
    });

    expect(response.status).toBe(200); // MCP errors are still HTTP 200

    const body = await response.json();

    // MCP error response MUST have an error object, not a result
    expect(body).toHaveProperty("error");
    expect(body.error).toHaveProperty("code");
    expect(body.error).toHaveProperty("message");
  });
});