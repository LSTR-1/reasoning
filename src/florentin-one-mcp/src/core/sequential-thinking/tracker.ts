import { ThoughtData, ThinkingProcessResult } from "./types.js";
import { formatThought } from "./formatter.js";

export class SequentialThinkingTracker {
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};
  private disableThoughtLogging: boolean;

  constructor() {
    this.disableThoughtLogging = false;
  }

  public validateThoughtData(input: unknown): ThoughtData {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid input: must be an object");
    }
    const data = input as Record<string, unknown>;

    if (typeof data.thought !== "string" || data.thought.trim() === "") {
      throw new Error("Invalid thought: must be a non-empty string");
    }
    if (typeof data.thoughtNumber !== "number" || data.thoughtNumber < 1) {
      throw new Error("Invalid thoughtNumber: must be a number >= 1");
    }
    if (typeof data.totalThoughts !== "number" || data.totalThoughts < 1) {
      throw new Error("Invalid totalThoughts: must be a number >= 1");
    }
    if (typeof data.nextThoughtNeeded !== "boolean") {
      throw new Error("Invalid nextThoughtNeeded: must be a boolean");
    }

    return {
      thought: data.thought,
      thoughtNumber: data.thoughtNumber,
      totalThoughts: data.totalThoughts,
      nextThoughtNeeded: data.nextThoughtNeeded,
      isRevision: typeof data.isRevision === "boolean" ? data.isRevision : undefined,
      revisesThought: typeof data.revisesThought === "number" ? data.revisesThought : undefined,
      branchFromThought: typeof data.branchFromThought === "number" ? data.branchFromThought : undefined,
      branchId: typeof data.branchId === "string" ? data.branchId : undefined,
      needsMoreThoughts: typeof data.needsMoreThoughts === "boolean" ? data.needsMoreThoughts : undefined
    };
  }

  public processThought(input: unknown): ThinkingProcessResult {
    try {
      const validatedInput = this.validateThoughtData(input);

      const adjustedTotalThoughts =
        validatedInput.thoughtNumber > validatedInput.totalThoughts
          ? validatedInput.thoughtNumber
          : validatedInput.totalThoughts;

      const thoughtData = { ...validatedInput, totalThoughts: adjustedTotalThoughts };
      this.thoughtHistory.push(thoughtData);

      if (validatedInput.branchFromThought && validatedInput.branchId) {
        if (!this.branches[validatedInput.branchId]) {
          this.branches[validatedInput.branchId] = [];
        }
        this.branches[validatedInput.branchId].push(validatedInput);
      }

      if (!this.disableThoughtLogging) {
        const formattedThought = formatThought(thoughtData);
        console.error(formattedThought);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                thoughtNumber: thoughtData.thoughtNumber,
                totalThoughts: thoughtData.totalThoughts,
                nextThoughtNeeded: thoughtData.nextThoughtNeeded,
                isRevision: thoughtData.isRevision,
                revisesThought: thoughtData.revisesThought,
                branchFromThought: thoughtData.branchFromThought,
                branchId: thoughtData.branchId,
                branches: Object.keys(this.branches),
                thoughtHistoryLength: this.thoughtHistory.length,
                needsMoreThoughts: thoughtData.needsMoreThoughts
              },
              null,
              2
            )
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : String(error),
                status: "failed"
              },
              null,
              2
            )
          }
        ],
        isError: true
      };
    }
  }
}
