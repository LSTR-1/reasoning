#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./agent/server.js";
import { shutdownMcpAnalytics } from "./lib/posthog.js";

// Export Code Mode APIs from local codemode barrel
export { MetacognitiveCodeMode } from "./codemode/metacognitive-monitoring/index.js";
export { SequentialThinking } from "./codemode/sequential-thinking/index.js";
export { CollaborativeReasoning } from "./codemode/collaborative-reasoning/index.js";
export { ScientificMethodCodeMode } from "./codemode/scientific-method/index.js";
export { StructuredArgumentation } from "./codemode/structured-argumentation/index.js";
export { ConstraintSolver } from "./codemode/constraint-solver/index.js";
export { NarrativePlanner } from "./codemode/narrative-planner/index.js";

// Export the server factory
export { createServer };

// Run MCP server on stdio if executed directly
if (import.meta.main) {
  const server = createServer();

  process.on("SIGTERM", async () => {
    await shutdownMcpAnalytics();
    process.exit(0);
  });

  async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Florentin One Unified MCP Server running on stdio");
  }

  runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    throw error;
  });
}
