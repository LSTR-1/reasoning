# Testing Framework — @florentin-one/mcp

**Audience:** Developers maintaining the Florentin One MCP monorepo.
**Purpose:** Reference for the tiered test architecture, CI pipeline, templates, and annual maintenance procedures.
**Last updated:** 2026-08-21

---

## 1. Architecture Overview

The testing framework implements a three-tier test pyramid using vitest workspaces. Each tier maps to a vitest project, a CI job, and a directory convention under `__tests__/`.

```
                        ┌─────────────┐
                        │     E2E     │  main-branch only, deployed worker
                        │  < 5 tests  │  run before deploy
                        │  (sparse)   │
                        └──────┬──────┘
                               │
                  ┌────────────┴────────────┐
                  │      Integration        │  PR + main, miniflare runtime
                  │     < 20 tests          │  run before PR merge
                  │     (medium)            │
                  └────────────┬────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │               Unit                  │  every push, pure logic
            │            > 50 tests               │  run on every save
            │            (many, fast)             │
            └─────────────────────────────────────┘
```

### How vitest workspace projects map to tiers

The root `vitest.config.ts` defines three workspace projects, each pointing at the same package root (`src/florentin-one-mcp`) but with different `include` globs and runtime configurations:

| Project       | `include` pattern              | Environment      | Timeout |
|---------------|--------------------------------|------------------|---------|
| `unit`        | `__tests__/unit/**`            | `node`           | 10s     |
| `integration` | `__tests__/integration/**`     | `miniflare`      | 60s     |
| `e2e`         | `__tests__/e2e/**`             | `node`           | default |

The `integration` project uses `@cloudflare/vitest-pool-workers` and `environment: "miniflare"` to simulate the Cloudflare Workers runtime locally, providing in-memory KV, R2, and D1 bindings.

### How CI pipeline maps to tiers

| Event              | Unit | Integration | E2E |
|--------------------|------|-------------|-----|
| PR (opened/sync)   | ✓    | ✓           | —   |
| Push to `main`     | ✓    | ✓           | ✓   |

- **PR**: `test.yml` runs `unit` and `integration` jobs in parallel. Both must pass.
- **Main push**: All three jobs run. The `e2e` job is gated by `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`.
- **Deploy gate**: `deploy.yml` queries the GitHub API for the `test.yml` conclusion at the current SHA. Deployment proceeds only if tests passed (`success`).

---

## 2. Tier Strategy

### Unit (`< 10s`)

- **What**: Pure logic tests. No I/O, no network, no Cloudflare bindings.
- **Environment**: `node` (default vitest environment).
- **Location**: `src/<package>/__tests__/unit/`.
- **Mocking**: `vi.fn()` for function spies, `vi.mock()` for module-level mocks. Use `createTestFixture()` from `@florentin-one/test-utils` for data factories.
- **Run**: `pnpm run test:unit` (or `pnpm exec vitest --project unit`).
- **When**: On every file save during development. CI on every PR push.

### Integration (`< 60s`)

- **What**: Cross-module workflows, MCP tool chains, Cloudflare binding interactions.
- **Environment**: `miniflare` with `@cloudflare/vitest-pool-workers`. Provides in-memory KV, R2, D1.
- **Location**: `src/<package>/__tests__/integration/`.
- **Mocking**: Use `createMiniflareInstance()` from `cloudflare-mocks.ts` to spin up a local runtime. Use `SELF.fetch()` (Cloudflare test API) to send HTTP requests to the worker.
- **Run**: `pnpm run test:integration` (or `pnpm exec vitest --project integration`).
- **When**: Before pushing a PR branch. CI on every PR and main push.

### E2E (main-branch only)

- **What**: Smoke tests against the deployed Cloudflare Worker at the production URL.
- **Environment**: `node`. Tests make real HTTP requests to `https://florentin-one-mcp.florentin-one.workers.dev`.
- **Location**: `src/<package>/__tests__/e2e/`.
- **Prerequisites**: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets set in CI. Tests skip locally unless the token is present.
- **Run**: `pnpm run test:e2e` (or `pnpm exec vitest --project e2e`).
- **When**: Only on push to `main`. Never on PR branches.

---

## 3. Template Usage

Three test templates live in `templates/` at the repository root. Copy the appropriate template into your package's `__tests__/` directory, rename it, and replace the `TODO` placeholders.

### Which template for which scenario

| Scenario                                      | Template                    | Target directory                     |
|-----------------------------------------------|-----------------------------|--------------------------------------|
| Testing a single exported function or class   | `templates/unit.test.ts`    | `__tests__/unit/`                    |
| Testing a cross-module workflow or MCP tool   | `templates/integration.test.ts` | `__tests__/integration/`         |
| Testing the deployed production worker        | `templates/e2e.test.ts`     | `__tests__/e2e/`                     |

### Template structure conventions

All templates follow the same conventions:

- **File header**: JSDoc comment explaining the template purpose, copy instructions, and naming conventions.
- **Imports**: Pre-imported `describe`, `it`, `expect`, `vi`, `beforeEach`/`beforeAll`/`afterAll` from `vitest`. Shared utilities from `@florentin-one/test-utils`.
- **TODO markers**: `// TODO:` comments mark where to replace placeholder code with actual module imports and assertions.
- **Arrange-Act-Assert**: Every test follows the AAA pattern with explicit `// Arrange`, `// Act`, `// Assert` comments.
- **Fixture pattern**: Unit tests use `createTestFixture()` for type-safe data factories. Integration tests use `createMockEnv()` and `createMockExecutionContext()`.

### Copy workflow

```bash
# Unit test
cp templates/unit.test.ts src/florentin-one-mcp/__tests__/unit/my-module.test.ts

# Integration test
cp templates/integration.test.ts src/florentin-one-mcp/__tests__/integration/my-workflow.test.ts

# E2E test
cp templates/e2e.test.ts src/florentin-one-mcp/__tests__/e2e/my-scenario.test.ts
```

After copying, replace all `TODO` markers with actual code. The templates compile as-is (they contain placeholder assertions that always pass), so you can verify the copy was successful before writing real tests.

---

## 4. CI Pipeline

### test.yml

**Triggers:**
- `pull_request`: `opened`, `synchronize`, `reopened`
- `push` to `main`

**Concurrency:** Grouped by PR number or ref. `cancel-in-progress: true` — a new push cancels the previous run for the same PR.

**Jobs:**

| Job           | Timeout | Condition                                          | Artifact                          |
|---------------|---------|----------------------------------------------------|-----------------------------------|
| `unit`        | 5 min   | Always                                             | `test-report-unit-{run_id}`       |
| `integration` | 10 min  | Always                                             | `test-report-integration-{run_id}`|
| `e2e`         | 15 min  | `push` + `refs/heads/main` only                    | `test-report-e2e-{run_id}`        |
| `cleanup`     | 3 min   | Always, `continue-on-error: true`                  | None                              |

All jobs use `pnpm install --frozen-lockfile` and run tests with `--reporter=json --outputFile=test-report.json`. Artifacts are uploaded with `if: always()` so reports are available even when tests fail.

### deploy.yml

**Triggers:**
- `push` to `main`
- `workflow_dispatch` (manual)
- `workflow_run`: `Test` workflow completed on `main`

**Jobs:**

1. **`check-tests`**: Queries `https://api.github.com/repos/florentin-one-cloud/mcp/actions/runs?head_sha={sha}&workflow_id=test.yml` to find the test run conclusion for the current commit.
   - `success` → proceed.
   - `failure`, `cancelled`, `timed_out`, `skipped` → deployment blocked (`exit 1`).
   - `not_found` → allowed with warning (first push or manual dispatch).

2. **`build`**: Runs `pnpm run build-all`, `pnpm run check` (type-check), and `pnpm run test:all`. Gated on `check-tests` passing.

3. **`deploy`**: Runs `cloudflare/wrangler-action@v4` in `src/florentin-one-mcp`. Gated on `build` passing.

### Interpreting CI annotations from the cleanup job

The `cleanup` job runs `pnpm run test:cleanup` and pipes output through a grep filter. Any line containing "warn" (case-insensitive) is emitted as a GitHub Actions `::warning::` annotation. These appear in the PR's "Files changed" tab as yellow warnings.

**Example annotation:**
```
::warning::[test-cleanup] ORPHANED: src/florentin-one-mcp/__tests__/unit/old-module.test.ts:5 — missing import "./deleted-module.js"
```

This means a test file imports a source module that no longer exists. Delete the orphaned test file or update its imports.

---

## 5. Annual Maintenance Procedures

Perform these steps once per year (or after major dependency upgrades) to keep the test suite healthy.

### Step 1: Find orphaned tests

```bash
pnpm run test:cleanup
```

This scans all `__tests__/` directories and flags test files whose relative imports resolve to non-existent source modules. Orphaned tests are printed to stderr. The script always exits 0 (never blocks CI).

**Action:** Delete orphaned test files or update their imports to point at the correct modules.

### Step 2: Identify recurring failures

```bash
GITHUB_TOKEN=<your-token> pnpm run test:history
```

This fetches the last 20 `test.yml` workflow runs from GitHub, downloads test report artifacts, and aggregates failures by test name. Output is sorted by failure frequency.

**Action:** Investigate the most frequent failures. Common causes:
- Flaky tests with race conditions or timeouts.
- Tests coupled to implementation details that changed.
- Environment-dependent tests that fail in CI but pass locally.

### Step 3: Review and update Cloudflare mock helpers

File: `src/florentin-one-mcp/__tests__/helpers/cloudflare-mocks.ts`

Check the Miniflare `compatibilityDate` and `compatibilityFlags`. Update to match the current `wrangler.jsonc` configuration. Verify that `createMiniflareInstance()` declares all bindings used by the worker (KV namespaces, R2 buckets, D1 databases).

If new Cloudflare services were added to the worker (e.g., Queues, Durable Objects, Service Bindings), add corresponding mock bindings. See [Extension Points — Add a new Cloudflare service mock](#add-a-new-cloudflare-service-mock).

### Step 4: Update test templates if conventions changed

Files: `templates/unit.test.ts`, `templates/integration.test.ts`, `templates/e2e.test.ts`

Review templates against the actual test files in `src/florentin-one-mcp/__tests__/`. If the real tests have diverged from the templates (new import patterns, new utility functions, different assertion style), update the templates to match.

### Step 5: Verify all tiers pass

```bash
pnpm run test:all
```

This runs `pnpm -r test`, which executes all vitest projects across all workspace packages. All three tiers (unit, integration, e2e) must pass.

For e2e tests, set the required environment variables:

```bash
CLOUDFLARE_API_TOKEN=<your-token> CLOUDFLARE_ACCOUNT_ID=<your-account-id> pnpm run test:e2e
```

### Step 6: Check CI pipeline is green on latest main

Navigate to `https://github.com/florentin-one-cloud/mcp/actions/workflows/test.yml` and verify the latest run on `main` is green. Check the `cleanup` job annotations for any orphaned test warnings.

---

## 6. Extension Points

### Add a new vitest workspace project for a new tier

**Scenario:** You want a "contract" test tier that validates API schemas against OpenAPI specs.

**Step 1:** Add a new workspace entry in `vitest.config.ts`:

```typescript
// vitest.config.ts — add to the `workspace` array
{
  root: "./src/florentin-one-mcp",
  extends: "./src/florentin-one-mcp/vitest.config.ts",
  test: {
    name: "contract",
    testTimeout: 30000,
    include: ["__tests__/contract/**"],
    environment: "node"
  }
}
```

**Step 2:** Add a pnpm script in `package.json`:

```json
"test:contract": "pnpm exec vitest run --project contract"
```

**Step 3:** Add a CI job in `.github/workflows/test.yml`:

```yaml
contract:
  runs-on: ubuntu-latest
  timeout-minutes: 5
  steps:
    - uses: actions/checkout@v6
    - uses: pnpm/action-setup@v4
      with:
        version: 11
    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: pnpm
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: Run contract tests
      run: pnpm run test:contract -- --reporter=json --outputFile=test-report.json
    - name: Upload test report
      uses: actions/upload-artifact@v5
      if: always()
      with:
        name: test-report-contract-${{ github.run_id }}
        path: test-report.json
```

**Step 4:** Create the directory and add tests:

```bash
mkdir -p src/florentin-one-mcp/__tests__/contract
```

### Add a new Cloudflare service mock

**Scenario:** The worker now uses Cloudflare Queues. You need a mock binding for integration tests.

**Step 1:** Add the binding to `createMiniflareInstance()` in `src/florentin-one-mcp/__tests__/helpers/cloudflare-mocks.ts`:

```typescript
// Inside the workers[0].config.env object:
TEST_QUEUE: { type: "queue", queueName: "test-queue" }
```

**Step 2:** Add a getter function:

```typescript
export async function getMockQueue(miniflare: Miniflare): Promise<Queue> {
  return miniflare.getQueue("TEST_QUEUE");
}
```

**Step 3:** Add the `Queue` type to `MockEnv` in `src/shared/test-utils/index.ts`:

```typescript
export interface MockQueue {
  send: ReturnType<typeof vi.fn>;
  sendBatch: ReturnType<typeof vi.fn>;
}

export interface MockEnv {
  KV: MockKVNamespace;
  R2: MockR2Bucket;
  DB: MockD1Database;
  QUEUE: MockQueue;
  [key: string]: unknown;
}
```

**Step 4:** Add the default mock in `createMockEnv()`:

```typescript
const queue: MockQueue = {
  send: vi.fn(),
  sendBatch: vi.fn()
};

return {
  KV: kv,
  R2: r2,
  DB: d1,
  QUEUE: queue,
  ...bindings
};
```

**Step 5:** Update the integration test template to include the new binding in `createMockEnv()` calls.

### Customize CI gating rules

**Scenario:** Make integration tests blocking on PR (they already are, but suppose you want to add a required status check).

**Option A — Make a job depend on another:**

```yaml
# In test.yml, make e2e depend on integration passing:
e2e:
  needs: integration
  # ... rest of job
```

**Option B — Add a required status check in GitHub branch protection:**

1. Go to repository Settings → Branches → Branch protection rules.
2. Edit the `main` branch rule.
3. Under "Require status checks to pass before merging", add `integration` and `unit`.

**Option C — Gate deployment on a specific job rather than the whole workflow:**

Modify `deploy.yml` `check-tests` to query a specific job conclusion instead of the workflow conclusion:

```bash
# Query specific job conclusion
JOBS=$(curl -s -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/florentin-one-cloud/mcp/actions/runs/$RUN_ID/jobs")

E2E_CONCLUSION=$(echo "$JOBS" | jq -r '.jobs[] | select(.name=="e2e") | .conclusion')
```

### Add a new package to the test workspace

**Scenario:** You add a new workspace package at `src/my-new-package/`.

**Step 1:** Create the package's vitest config at `src/my-new-package/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node"
  }
});
```

**Step 2:** Add workspace entries in the root `vitest.config.ts`:

```typescript
{
  root: "./src/my-new-package",
  extends: "./src/my-new-package/vitest.config.ts",
  test: {
    name: "my-new-package-unit",
    testTimeout: 10000,
    include: ["__tests__/unit/**"]
  }
},
{
  root: "./src/my-new-package",
  extends: "./src/my-new-package/vitest.config.ts",
  test: {
    name: "my-new-package-integration",
    testTimeout: 60000,
    include: ["__tests__/integration/**"],
    environment: "miniflare",
    pool: "@cloudflare/vitest-pool-workers"
  }
}
```

**Step 3:** Add a `test` script in `src/my-new-package/package.json`:

```json
"scripts": {
  "test": "vitest run"
}
```

**Step 4:** Verify the package is picked up by `pnpm run test:all` (which runs `pnpm -r test` across all workspaces).

---

## 7. Commands Reference

| Command                      | Description                                                  |
|------------------------------|--------------------------------------------------------------|
| `pnpm run test`              | Run all vitest projects (unit + integration + e2e)           |
| `pnpm run test:unit`         | Run only the `unit` vitest project                           |
| `pnpm run test:integration`  | Run only the `integration` vitest project (miniflare)        |
| `pnpm run test:e2e`          | Run only the `e2e` vitest project (requires API token)       |
| `pnpm run test:all`          | Run `pnpm -r test` — all workspace packages, all projects    |
| `pnpm run test:coverage`     | Run all projects with coverage reporting                     |
| `pnpm run test:coverage:all` | Run all workspace packages with coverage                     |
| `pnpm run test:cleanup`      | Scan for orphaned test files (imports to deleted modules)    |
| `pnpm run test:history`      | Fetch last 20 CI test runs and aggregate failure frequency   |

### Vitest CLI shortcuts

```bash
# Watch mode (unit only, re-runs on file change)
pnpm exec vitest --project unit

# Run a single test file
pnpm exec vitest run --project unit src/florentin-one-mcp/__tests__/unit/tracker.test.ts

# Run tests matching a pattern
pnpm exec vitest run --project integration -t "metacognitiveMonitoring"

# Update snapshots
pnpm exec vitest run --project unit --update
```

---

## File Index

| File                                                | Purpose                                           |
|-----------------------------------------------------|---------------------------------------------------|
| `vitest.config.ts`                                  | Root workspace config, defines 3 tier projects    |
| `src/florentin-one-mcp/vitest.config.ts`            | Package-level vitest defaults (globals, node env) |
| `templates/unit.test.ts`                            | Unit test template                                |
| `templates/integration.test.ts`                     | Integration test template (miniflare)             |
| `templates/e2e.test.ts`                             | E2E test template (deployed worker)               |
| `src/shared/test-utils/index.ts`                    | `createMockEnv`, `createMockExecutionContext`, `assertMCPResponse`, `createTestFixture` |
| `src/florentin-one-mcp/__tests__/helpers/cloudflare-mocks.ts` | `createMiniflareInstance`, `getMockKV`, `getMockR2`, `getMockD1` |
| `scripts/test-cleanup.ts`                           | Orphaned test detection                           |
| `scripts/test-history.ts`                           | CI failure aggregation                            |
| `.github/workflows/test.yml`                        | CI test pipeline (unit, integration, e2e, cleanup)|
| `.github/workflows/deploy.yml`                      | Deployment pipeline with test gate                |