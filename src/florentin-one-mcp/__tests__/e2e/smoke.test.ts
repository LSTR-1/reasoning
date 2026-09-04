// ---------------------------------------------------------------------------
// E2E Smoke Test — deployed worker at production URL
// ---------------------------------------------------------------------------
// This test calls the live production endpoint. It is skipped in local dev
// unless CLOUDFLARE_API_TOKEN is set, indicating a deliberate e2e run.
// ---------------------------------------------------------------------------

const PRODUCTION_URL = "https://florentin-one-mcp.florentin-one.workers.dev";

interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface McpContentItem {
  type: string;
  text: string;
}

interface McpJsonRpcResponse {
  jsonrpc: string;
  id: number;
  result: {
    tools: McpTool[];
    serverInfo: { name: string };
    capabilities: { tools: unknown };
    content: McpContentItem[];
    isError: boolean;
  };
}

function hasApiToken(): boolean {
  return typeof process !== "undefined" && !!process.env["CLOUDFLARE_API_TOKEN"];
}

function mcpRequest(method: string, params?: Record<string, unknown>): Record<string, unknown> {
  return {
    jsonrpc: "2.0",
    method,
    params: params ?? {},
    id: 1
  };
}

describe("E2E Smoke Test (Production Worker)", () => {
  it("responds to MCP tools/list request", async () => {
    if (!hasApiToken()) {
      console.warn("SKIPPED: CLOUDFLARE_API_TOKEN not set — skipping e2e smoke test");
      return;
    }

    const response = await fetch(PRODUCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(mcpRequest("tools/list"))
    });

    expect(response.status).toBe(200);

    const body = (await response.json()) as McpJsonRpcResponse;
    expect(body).toBeDefined();
    expect(body.jsonrpc).toBe("2.0");
    expect(body.id).toBe(1);
    expect(body.result).toBeDefined();
    expect(body.result.tools).toBeDefined();
    expect(Array.isArray(body.result.tools)).toBe(true);
    expect(body.result.tools.length).toBeGreaterThanOrEqual(7);

    // Validate each tool has required fields
    for (const tool of body.result.tools) {
      expect(tool.name).toBeDefined();
      expect(typeof tool.name).toBe("string");
      expect(tool.description).toBeDefined();
      expect(typeof tool.description).toBe("string");
      expect(tool.inputSchema).toBeDefined();
      expect(typeof tool.inputSchema).toBe("object");
    }
  });

  it("responds to MCP initialize request", async () => {
    if (!hasApiToken()) {
      console.warn("SKIPPED: CLOUDFLARE_API_TOKEN not set — skipping e2e smoke test");
      return;
    }

    const response = await fetch(PRODUCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "e2e-test-client", version: "1.0.0" }
        },
        id: 1
      })
    });

    expect(response.status).toBe(200);

    const body = (await response.json()) as McpJsonRpcResponse;
    expect(body.result).toBeDefined();
    expect(body.result.serverInfo).toBeDefined();
    expect(body.result.serverInfo.name).toBe("florentin-one-mcp");
    expect(body.result.capabilities).toBeDefined();
    expect(body.result.capabilities.tools).toBeDefined();
  });

  it("calls metacognitiveMonitoring with valid input", async () => {
    if (!hasApiToken()) {
      console.warn("SKIPPED: CLOUDFLARE_API_TOKEN not set — skipping e2e smoke test");
      return;
    }

    const response = await fetch(PRODUCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(
        mcpRequest("tools/call", {
          name: "metacognitiveMonitoring",
          arguments: {
            task: "e2e smoke test",
            stage: "knowledge-assessment",
            overallConfidence: 0.9,
            uncertaintyAreas: ["e2e testing"],
            recommendedApproach: "smoke test approach",
            monitoringId: "mm-e2e-smoke",
            iteration: 0,
            nextAssessmentNeeded: false
          }
        })
      )
    });

    expect(response.status).toBe(200);

    const body = (await response.json()) as McpJsonRpcResponse;
    expect(body.result).toBeDefined();
    expect(body.result.content).toBeDefined();
    expect(Array.isArray(body.result.content)).toBe(true);
    expect(body.result.content.length).toBeGreaterThan(0);
    expect(body.result.content[0].type).toBe("text");
    expect(typeof body.result.content[0].text).toBe("string");

    const parsed = JSON.parse(body.result.content[0].text);
    expect(parsed.monitoringId).toBe("mm-e2e-smoke");
  });

  it("returns error for invalid tool input", async () => {
    if (!hasApiToken()) {
      console.warn("SKIPPED: CLOUDFLARE_API_TOKEN not set — skipping e2e smoke test");
      return;
    }

    const response = await fetch(PRODUCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(
        mcpRequest("tools/call", {
          name: "metacognitiveMonitoring",
          arguments: {
            task: 123,
            stage: "knowledge-assessment",
            overallConfidence: 0.8,
            uncertaintyAreas: [],
            recommendedApproach: "test",
            monitoringId: "mm-error",
            iteration: 0,
            nextAssessmentNeeded: true
          }
        })
      )
    });

    expect(response.status).toBe(200);

    const body = (await response.json()) as McpJsonRpcResponse;
    expect(body.result).toBeDefined();
    // The tool handler catches errors and returns isError: true
    expect(body.result.isError).toBe(true);
  });
});