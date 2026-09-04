# Contributing to Florentin One MCP

## Getting Started

### Prerequisites

- **pnpm** >= 11.20.0
- **Node.js** >= 22
- **Git** for version control
- Basic understanding of TypeScript and the Model Context Protocol

### Clone and Setup

```bash
git clone https://github.com/florentin-one-cloud/mcp.git
cd mcp
pnpm install
pnpm run build-all
pnpm run test:all
```

## Repository Structure

```tree
mcp/
├── src/
│   └── florentin-one-mcp/          # Unified MCP server package
│       ├── src/
│       │   ├── agent/              # MCP server factory (createServer)
│       │   │   └── server.ts       # Registers all 7 tools on one McpServer
│       │   ├── tools/              # Tool implementations
│       │   ├── codemode/           # Direct TypeScript API
│       │   │   ├── metacognitive-monitoring/
│       │   │   ├── sequential-thinking/
│       │   │   ├── collaborative-reasoning/
│       │   │   ├── scientific-method/
│       │   │   ├── structured-argumentation/
│       │   │   ├── constraint-solver/
│       │   │   ├── narrative-planner/
│       │   │   └── index.ts        # Barrel export
│       │   ├── core/               # Pure business logic (no MCP deps)
│       │   │   ├── metacognitive-monitoring/
│       │   │   ├── sequential-thinking/
│       │   │   ├── collaborative-reasoning/
│       │   │   ├── scientific-method/
│       │   │   ├── structured-argumentation/
│       │   │   ├── constraint-solver/
│       │   │   ├── narrative-planner/
│       │   │   └── index.ts
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

## Development Workflow

### Building

```bash
# Build the unified package
pnpm run build-all
```

This runs `tsup` + `tsc` in `src/florentin-one-mcp/`, producing `dist/` with the worker bundle, stdio entry point, and type declarations.

### Testing

```bash
# Run all tests across the workspace
pnpm run test:all

# Run tests for the unified package only
cd src/florentin-one-mcp
pnpm test

# Run with coverage
pnpm run test:coverage:all
```

Tests use **Vitest**. Place test files next to the code they test with `.test.ts` extension.

### Working on a Tool

Each reasoning tool follows the same layered architecture:

1. **`core/`** — Pure business logic, no MCP or transport dependencies. Testable in isolation.
2. **`codemode/`** — Public TypeScript API wrapping core logic. Used by both MCP tools and direct programmatic consumers.
3. **`agent/server.ts`** — Registers the tool on the unified `McpServer` instance with Zod input schemas.

To add or modify a tool:

1. Implement or update logic in `src/florentin-one-mcp/src/core/<tool>/`
2. Update the Code Mode wrapper in `src/florentin-one-mcp/src/codemode/<tool>/`
3. Register the tool in `src/florentin-one-mcp/src/agent/server.ts`
4. Add tests and run `pnpm run test:all`

### Testing the Worker Locally

```bash
cd src/florentin-one-mcp
pnpm run build
pnpm exec wrangler dev
```

The worker is available at `http://localhost:8787`. Test with:

```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```

## Deploying

### Cloudflare Workers

```bash
cd src/florentin-one-mcp
pnpm exec wrangler deploy
```

A single `florentin-one-mcp` worker is deployed. The worker uses `createMcpHandler` from `agents/mcp/server` (Cloudflare Agents SDK) with MCP 2026-07-28 Streamable HTTP transport.

### NPM Publishing

1. Update the version in `src/florentin-one-mcp/package.json`
2. Create and push a version tag:

   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

3. GitHub Actions automatically builds, tests, and publishes `@florentin-one/mcp` to NPM.

## Commit Messages

Follow conventional commit format:

```
type(scope): brief description

Examples:
- feat(metacognitive): add confidence calibration
- fix(constraint-solver): handle division by zero
- docs(readme): update installation instructions
- chore(deps): upgrade MCP SDK to v2
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

## Code Standards

- TypeScript strict mode
- Define proper types for all functions; avoid `any`
- Use `const` over `let` when possible
- Prefer arrow functions for callbacks
- Use async/await over raw promises
- Format with Prettier: `pnpm run format`
- Type-check: `pnpm run check`

## Pull Request Process

1. Test thoroughly: `pnpm run build-all && pnpm run test:all && pnpm run check`
2. Update documentation if needed
3. Push your branch and create a PR with a clear description of changes and testing performed

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/florentin-one-cloud/mcp/issues)
- **Documentation**: [MCP Specification](https://modelcontextprotocol.io/)
