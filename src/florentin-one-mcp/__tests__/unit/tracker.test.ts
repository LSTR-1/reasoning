import { SequentialThinkingTracker } from "../../src/core/sequential-thinking/tracker.js";
import { createTestFixture } from "../../../shared/test-utils/index.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validThoughtFixture = createTestFixture({
  thought: "This is a test thought",
  thoughtNumber: 1,
  totalThoughts: 3,
  nextThoughtNeeded: true
});

// ---------------------------------------------------------------------------
// validateThoughtData
// ---------------------------------------------------------------------------

describe("SequentialThinkingTracker.validateThoughtData()", () => {
  let tracker: SequentialThinkingTracker;

  beforeEach(() => {
    tracker = new SequentialThinkingTracker();
  });

  // --- Valid input ---

  it("valid input passes validation", () => {
    const input = validThoughtFixture();
    const result = tracker.validateThoughtData(input);

    expect(result.thought).toBe("This is a test thought");
    expect(result.thoughtNumber).toBe(1);
    expect(result.totalThoughts).toBe(3);
    expect(result.nextThoughtNeeded).toBe(true);
  });

  // --- Empty thought ---

  it("throws when thought is an empty string", () => {
    const input = validThoughtFixture({ thought: "" });
    expect(() => tracker.validateThoughtData(input)).toThrow("Invalid thought: must be a non-empty string");
  });

  it("throws when thought is whitespace only", () => {
    const input = validThoughtFixture({ thought: "   " });
    expect(() => tracker.validateThoughtData(input)).toThrow("Invalid thought: must be a non-empty string");
  });

  it("throws when thought is not a string", () => {
    const input = validThoughtFixture({ thought: 123 as unknown as string });
    expect(() => tracker.validateThoughtData(input)).toThrow("Invalid thought: must be a non-empty string");
  });

  // --- thoughtNumber < 1 ---

  it("throws when thoughtNumber is less than 1", () => {
    const input = validThoughtFixture({ thoughtNumber: 0 });
    expect(() => tracker.validateThoughtData(input)).toThrow("Invalid thoughtNumber: must be a number >= 1");
  });

  it("throws when thoughtNumber is negative", () => {
    const input = validThoughtFixture({ thoughtNumber: -5 });
    expect(() => tracker.validateThoughtData(input)).toThrow("Invalid thoughtNumber: must be a number >= 1");
  });

  it("throws when thoughtNumber is not a number", () => {
    const input = validThoughtFixture({ thoughtNumber: "one" as unknown as number });
    expect(() => tracker.validateThoughtData(input)).toThrow("Invalid thoughtNumber: must be a number >= 1");
  });

  // --- totalThoughts < 1 ---

  it("throws when totalThoughts is less than 1", () => {
    const input = validThoughtFixture({ totalThoughts: 0 });
    expect(() => tracker.validateThoughtData(input)).toThrow("Invalid totalThoughts: must be a number >= 1");
  });

  it("throws when totalThoughts is negative", () => {
    const input = validThoughtFixture({ totalThoughts: -3 });
    expect(() => tracker.validateThoughtData(input)).toThrow("Invalid totalThoughts: must be a number >= 1");
  });

  it("throws when totalThoughts is not a number", () => {
    const input = validThoughtFixture({ totalThoughts: "three" as unknown as number });
    expect(() => tracker.validateThoughtData(input)).toThrow("Invalid totalThoughts: must be a number >= 1");
  });

  // --- nextThoughtNeeded not boolean ---

  it("throws when nextThoughtNeeded is not a boolean", () => {
    const input = validThoughtFixture({ nextThoughtNeeded: "yes" as unknown as boolean });
    expect(() => tracker.validateThoughtData(input)).toThrow("Invalid nextThoughtNeeded: must be a boolean");
  });

  it("throws when nextThoughtNeeded is missing", () => {
    const { nextThoughtNeeded: _, ...rest } = validThoughtFixture();
    expect(() => tracker.validateThoughtData(rest)).toThrow("Invalid nextThoughtNeeded: must be a boolean");
  });

  // --- null / non-object input ---

  it("throws when input is null", () => {
    expect(() => tracker.validateThoughtData(null)).toThrow("Invalid input: must be an object");
  });

  it("throws when input is a string", () => {
    expect(() => tracker.validateThoughtData("not an object")).toThrow("Invalid input: must be an object");
  });

  // --- Optional fields preserved ---

  it("preserves isRevision when provided", () => {
    const input = validThoughtFixture({ isRevision: true });
    const result = tracker.validateThoughtData(input);
    expect(result.isRevision).toBe(true);
  });

  it("preserves revisesThought when provided", () => {
    const input = validThoughtFixture({ revisesThought: 2 });
    const result = tracker.validateThoughtData(input);
    expect(result.revisesThought).toBe(2);
  });

  it("preserves branchFromThought when provided", () => {
    const input = validThoughtFixture({ branchFromThought: 1 });
    const result = tracker.validateThoughtData(input);
    expect(result.branchFromThought).toBe(1);
  });

  it("preserves branchId when provided", () => {
    const input = validThoughtFixture({ branchId: "branch-1" });
    const result = tracker.validateThoughtData(input);
    expect(result.branchId).toBe("branch-1");
  });

  it("preserves needsMoreThoughts when provided", () => {
    const input = validThoughtFixture({ needsMoreThoughts: true });
    const result = tracker.validateThoughtData(input);
    expect(result.needsMoreThoughts).toBe(true);
  });

  it("omits optional fields when not provided", () => {
    const input = validThoughtFixture();
    const result = tracker.validateThoughtData(input);

    expect(result.isRevision).toBeUndefined();
    expect(result.revisesThought).toBeUndefined();
    expect(result.branchFromThought).toBeUndefined();
    expect(result.branchId).toBeUndefined();
    expect(result.needsMoreThoughts).toBeUndefined();
  });

  it("does not preserve optional fields when wrong type (isRevision as string)", () => {
    const input = validThoughtFixture({ isRevision: "true" as unknown as boolean });
    const result = tracker.validateThoughtData(input);
    expect(result.isRevision).toBeUndefined();
  });

  it("does not preserve optional fields when wrong type (revisesThought as string)", () => {
    const input = validThoughtFixture({ revisesThought: "2" as unknown as number });
    const result = tracker.validateThoughtData(input);
    expect(result.revisesThought).toBeUndefined();
  });

  // --- Boundary values ---

  it("accepts thoughtNumber at boundary 1", () => {
    const input = validThoughtFixture({ thoughtNumber: 1 });
    const result = tracker.validateThoughtData(input);
    expect(result.thoughtNumber).toBe(1);
  });

  it("accepts totalThoughts at boundary 1", () => {
    const input = validThoughtFixture({ totalThoughts: 1 });
    const result = tracker.validateThoughtData(input);
    expect(result.totalThoughts).toBe(1);
  });

  it("accepts nextThoughtNeeded as false", () => {
    const input = validThoughtFixture({ nextThoughtNeeded: false });
    const result = tracker.validateThoughtData(input);
    expect(result.nextThoughtNeeded).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// processThought
// ---------------------------------------------------------------------------

describe("SequentialThinkingTracker.processThought()", () => {
  let tracker: SequentialThinkingTracker;

  beforeEach(() => {
    tracker = new SequentialThinkingTracker();
  });

  // --- Returns correct shape ---

  it("returns correct ThinkingProcessResult shape with content array", () => {
    const input = validThoughtFixture();
    const result = tracker.processThought(input);

    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.content[0].type).toBe("text");
    expect(typeof result.content[0].text).toBe("string");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.thoughtNumber).toBe(1);
    expect(parsed.totalThoughts).toBe(3);
    expect(parsed.nextThoughtNeeded).toBe(true);
    expect(parsed.thoughtHistoryLength).toBe(1);
  });

  // --- Adjusts totalThoughts ---

  it("adjusts totalThoughts when thoughtNumber > totalThoughts", () => {
    const input = validThoughtFixture({ thoughtNumber: 5, totalThoughts: 3 });
    const result = tracker.processThought(input);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.thoughtNumber).toBe(5);
    expect(parsed.totalThoughts).toBe(5);
  });

  it("does not adjust totalThoughts when thoughtNumber <= totalThoughts", () => {
    const input = validThoughtFixture({ thoughtNumber: 2, totalThoughts: 5 });
    const result = tracker.processThought(input);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.totalThoughts).toBe(5);
  });

  // --- Branch tracking ---

  it("handles branch tracking when branchFromThought and branchId provided", () => {
    const input = validThoughtFixture({ branchFromThought: 1, branchId: "branch-a" });
    const result = tracker.processThought(input);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.branchFromThought).toBe(1);
    expect(parsed.branchId).toBe("branch-a");
    expect(parsed.branches).toContain("branch-a");
  });

  it("does not add to branches when branchId is missing", () => {
    const input = validThoughtFixture({ branchFromThought: 1 });
    const result = tracker.processThought(input);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.branches).toEqual([]);
  });

  it("does not add to branches when branchFromThought is missing", () => {
    const input = validThoughtFixture({ branchId: "branch-b" });
    const result = tracker.processThought(input);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.branches).toEqual([]);
  });

  it("accumulates multiple thoughts in the same branch", () => {
    tracker.processThought(validThoughtFixture({ branchFromThought: 1, branchId: "branch-x", thoughtNumber: 2 }));
    const result = tracker.processThought(
      validThoughtFixture({ branchFromThought: 1, branchId: "branch-x", thoughtNumber: 3 })
    );

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.branches).toContain("branch-x");
  });

  // --- thoughtHistoryLength ---

  it("increments thoughtHistoryLength across multiple calls", () => {
    tracker.processThought(validThoughtFixture({ thoughtNumber: 1 }));
    tracker.processThought(validThoughtFixture({ thoughtNumber: 2 }));
    const result = tracker.processThought(validThoughtFixture({ thoughtNumber: 3 }));

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.thoughtHistoryLength).toBe(3);
  });

  // --- Error handling ---

  it("returns error result on invalid input (isError: true)", () => {
    const result = tracker.processThought({ thought: "" });

    expect(result.isError).toBe(true);
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe("failed");
    expect(parsed.error).toBeDefined();
  });

  it("returns error result when thoughtNumber is 0", () => {
    const result = tracker.processThought(validThoughtFixture({ thoughtNumber: 0 }));

    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe("failed");
  });

  it("returns error result when totalThoughts is 0", () => {
    const result = tracker.processThought(validThoughtFixture({ totalThoughts: 0 }));

    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe("failed");
  });

  // --- Optional fields in result ---

  it("includes isRevision in result when provided", () => {
    const input = validThoughtFixture({ isRevision: true, revisesThought: 1 });
    const result = tracker.processThought(input);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.isRevision).toBe(true);
    expect(parsed.revisesThought).toBe(1);
  });

  it("includes needsMoreThoughts in result when provided", () => {
    const input = validThoughtFixture({ needsMoreThoughts: true });
    const result = tracker.processThought(input);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.needsMoreThoughts).toBe(true);
  });

  // --- nextThoughtNeeded false ---

  it("returns nextThoughtNeeded false when set", () => {
    const input = validThoughtFixture({ nextThoughtNeeded: false });
    const result = tracker.processThought(input);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.nextThoughtNeeded).toBe(false);
  });
});