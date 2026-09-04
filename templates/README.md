# Test Templates — @florentin-one/mcp

One-page quickstart for the tiered testing strategy.

## Quick Copy

```bash
# From the monorepo root, copy the template you need:
cp templates/unit.test.ts src/<your-package>/__tests__/unit/<name>.test.ts
cp templates/integration.test.ts src/<your-package>/__tests__/integration/<name>.test.ts
cp templates/e2e.test.ts src/<your-package>/__tests__/e2e/<name>.test.ts
```

Then replace `TODO` markers with your actual module imports and test logic.

## Which Template When

| Template | Tier | Use for | Environment |
| --- | --- | --- | --- |
| `unit.test.ts` | Unit | Single function/class in isolation; no I/O | `node` |
| `integration.test.ts` | Integration | Cross-module workflows; KV/R2/D1 bindings; MCP tool chains | `miniflare` |
| `e2e.test.ts` | E2E | Deployed worker validation; full HTTP round-trips | live Cloudflare |

## How to Run

```bash
pnpm run test:unit          # __tests__/unit/** — fast, no network
pnpm run test:integration   # __tests__/integration/** — miniflare runtime
pnpm run test:e2e           # __tests__/e2e/** — against deployed worker (main only)
pnpm run test               # all tiers
```

## Shared Utilities

- **`@florentin-one/test-utils`** (`src/shared/test-utils/index.ts`)
  - `createMockExecutionContext(props?)` — mock Cloudflare Workers `ExecutionContext`
  - `createMockEnv(bindings?)` — mock `Env` with KV, R2, D1 stubs
  - `assertMCPResponse(response)` — validate MCP protocol response shape, return parsed JSON
  - `createTestFixture(defaults)` — generic factory for test data with optional overrides

- **Cloudflare Mock Helpers** (`src/florentin-one-mcp/__tests__/helpers/cloudflare-mocks.ts`)
  - `createMiniflareInstance()` — start an in-memory Miniflare runtime
  - `getMockKV(mf)` / `getMockR2(mf)` / `getMockD1(mf)` — extract typed bindings

## Tiered Strategy

1. **Unit** — Fast, deterministic, no external dependencies. Mock everything. Run on every commit.
2. **Integration** — Test module composition and binding interactions inside Miniflare. Run on every PR.
3. **E2E** — Validate the deployed worker against the live Cloudflare edge. Run on main branch only. Requires `CLOUDFLARE_API_TOKEN` and `DEPLOYED_WORKER_URL` in the environment.

## Naming Convention

```txt
describe("ModuleName", () => {
  describe("methodName", () => {
    it("should behave like X when Y", () => { ... })
  })
})
```

- Outer `describe` = the module / class / file under test.
- Inner `describe` = the exported function or method.
- `it` = one specific behavior, phrased as "should <outcome> when <condition>".