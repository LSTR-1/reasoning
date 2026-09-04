# Florentin One Unified MCP Server

> **AI-First Enterprise Solutions for the German Market**

`@florentin-one/mcp` is a single, unified [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server
packaging all seven Florentin One reasoning tools into one Cloudflare Worker. Built for enterprise environments with
GDPR compliance, German data sovereignty, and zero-downtime deployment.

## Architecture

A single `@florentin-one/mcp` package exposes all seven reasoning tools through one MCP endpoint. The server runs on
Cloudflare Workers with Durable Objects for state management, deployed exclusively within EU data jurisdiction.

```
┌──────────────────────────────────────────────┐
│  @florentin-one/mcp (single package)         │
│  ┌────────────────────────────────────────┐  │
│  │  MCP Server (Streamable HTTP)          │  │
│  │  metacognitiveMonitoring               │  │
│  │  sequentialthinking                    │  │
│  │  collaborativeReasoning                │  │
│  │  scientificMethod                      │  │
│  │  structuredArgumentation               │  │
│  │  constraintSolver                      │  │
│  │  narrativePlanner                      │  │
│  └────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Code Mode   │  │  Agent SDK Handler   │  │
│  │  (direct TS) │  │  (createMcpHandler)  │  │
│  └──────────────┘  └──────────────────────┘  │
└──────────────────────────────────────────────┘
```

## MCP Specification

Implements **MCP 2026-07-28** using `@modelcontextprotocol/server` v2 with **Streamable HTTP transport** — a fully
stateless protocol. Each request is self-contained; no session affinity or sticky routing required.

## Installation

```bash
npm install @florentin-one/mcp
```

A single package replaces the previous seven individual `@florentin-one/mcp-*` packages.

## Available Tools

| Tool | Description |
| --- | --- |
| `metacognitiveMonitoring` | Systematic self-monitoring: knowledge boundaries, confidence calibration, bias detection |
| `sequentialthinking` | Dynamic step-by-step reasoning with revision, branching, and dependency tracking |
| `collaborativeReasoning` | Multi-persona expert collaboration simulation with structured disagreement resolution |
| `scientificMethod` | Formal hypothesis testing, variable identification, experiment design, evidence evaluation |
| `structuredArgumentation` | Dialectical reasoning with thesis-antithesis-synthesis progression |
| `constraintSolver` | Mathematical constraint satisfaction validation for numeric variables |
| `narrativePlanner` | Three-act story structure planning with character development |

## MCP Client Configuration

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "Florentin One MCP": {
      "command": "npx",
      "args": ["@florentin-one/mcp@latest"]
    }
  }
}
```

### Claude Desktop

Add to Claude Desktop configuration:

```json
{
  "mcpServers": {
    "florentin-one-mcp": {
      "command": "npx",
      "args": ["@florentin-one/mcp@latest"]
    }
  }
}
```

### Cloudflare MCP Portals

Connect via HTTP endpoint:

```
https://mcp.florentin-one.de/mcp
```

Configure your MCP portal with the Streamable HTTP transport URL above. No additional tool-specific endpoints required —
all seven tools are served from the single endpoint.

## Code Mode API

Use reasoning tools directly in TypeScript without MCP transport overhead:

```typescript
import {
  MetacognitiveCodeMode,
  SequentialThinking,
  CollaborativeReasoning,
  ScientificMethodCodeMode,
  StructuredArgumentation,
  ConstraintSolver,
  NarrativePlanner
} from "@florentin-one/mcp";

const metacognitive = new MetacognitiveCodeMode();
const result = await metacognitive.monitor({
  task: "architecture review",
  stage: "knowledge-assessment",
  overallConfidence: 0.8,
  uncertaintyAreas: ["distributed consensus"],
  recommendedApproach: "systematic review",
  monitoringId: "mm-arch-20260820",
  iteration: 0,
  nextAssessmentNeeded: true
});
```

## Cloudflare Deployment

A single Cloudflare Worker with Durable Objects for state management:

- **Worker**: `florentin-one-mcp` — single entry point for all seven tools
- **Durable Object**: `FlorentinOneMCP` — SQLite-backed state persistence
- **Jurisdiction**: EU-only deployment, compliant with German data sovereignty requirements under GDPR Art. 28
- **Transport**: Streamable HTTP, stateless, no session affinity

Deploy from the package directory:

```bash
cd src/florentin-one-mcp
pnpm exec wrangler deploy
```

## Development

### Prerequisites

- **pnpm** >= 11.20.0
- **Node.js** >= 22
- **Git** for version control

### Setup

```bash
git clone https://github.com/florentin-one-cloud/mcp.git
cd mcp
pnpm install
pnpm run build-all
pnpm run test:all
```

### Project Structure

```tree
mcp/
├── src/
│   └── florentin-one-mcp/          # Unified MCP server package
│       ├── src/
│       │   ├── agent/              # MCP server factory (createServer)
│       │   ├── tools/              # Tool implementations
│       │   ├── codemode/           # Direct TypeScript API (7 tools)
│       │   ├── core/               # Pure business logic (7 tools)
│       │   ├── lib/                # Shared utilities (PostHog analytics)
│       │   ├── index.ts            # Stdio entry point + Code Mode exports
│       │   └── worker.ts           # Cloudflare Worker entry point
│       ├── package.json
│       ├── tsup.config.ts
│       ├── vitest.config.ts
│       └── wrangler.jsonc
├── .github/workflows/              # CI/CD pipelines
├── package.json                    # pnpm workspace root
└── pnpm-workspace.yaml
```

## License

MIT. See [LICENSE](LICENSE) for details.
