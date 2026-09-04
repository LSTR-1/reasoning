import { Miniflare } from "miniflare";

/**
 * Creates a Miniflare instance with in-memory KV, R2, and D1 simulation.
 * The instance runs a minimal no-op worker to host the bindings.
 */
export async function createMiniflareInstance(): Promise<Miniflare> {
  const mf = new Miniflare({
    workers: [
      {
        config: {
          name: "test-worker",
          type: "worker",
          compatibilityDate: "2025-01-01",
          compatibilityFlags: ["nodejs_compat"],
          manifest: {
            mainModule: "index.mjs",
            modules: {
              "index.mjs": {
                type: "esm",
                contents: "export default { fetch() { return new Response('ok'); } }"
              }
            }
          },
          env: {
            TEST_KV: { type: "kv", id: "TEST_KV" },
            TEST_R2: { type: "r2", name: "TEST_R2" },
            TEST_D1: { type: "d1", name: "TEST_D1" }
          }
        }
      }
    ]
  });
  return mf;
}

/**
 * Returns a KV namespace mock from the Miniflare instance.
 */
export async function getMockKV(miniflare: Miniflare): ReturnType<Miniflare["getKVNamespace"]> {
  return miniflare.getKVNamespace("TEST_KV");
}

/**
 * Returns an R2 bucket mock from the Miniflare instance.
 */
export async function getMockR2(miniflare: Miniflare): ReturnType<Miniflare["getR2Bucket"]> {
  return miniflare.getR2Bucket("TEST_R2");
}

/**
 * Returns a D1 database mock from the Miniflare instance.
 */
export async function getMockD1(miniflare: Miniflare): Promise<D1Database> {
  return miniflare.getD1Database("TEST_D1");
}