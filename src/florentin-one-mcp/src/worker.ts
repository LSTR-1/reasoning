import { createMcpHandler } from "agents/mcp/server";
import { createServer } from "./agent/server.js";

export default {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetch(request: Request, env: unknown, ctx: any) {
    return createMcpHandler(createServer)(request, env, ctx);
  }
};
