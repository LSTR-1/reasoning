import { SequentialThinkingTracker } from "../../core/sequential-thinking/tracker.js";
import { ThoughtData, ThinkingProcessResult } from "../../core/sequential-thinking/types.js";

/**
 * Sequential Thinking Code Mode API.
 *
 * This class exposes the Sequential Thinking capabilities as a strictly-typed
 * TypeScript API, allowing LLMs to write code that interacts directly with
 * the thinking process.
 */
export class SequentialThinking {
  private tracker: SequentialThinkingTracker;

  constructor() {
    this.tracker = new SequentialThinkingTracker();
  }

  /**
   * Process a thought in the sequential thinking process.
   *
   * @param input - The thought data to process.
   * @returns The result of the thinking process.
   */
  public think(input: ThoughtData): ThinkingProcessResult {
    // The tracker accepts unknown, but we enforce ThoughtData at this layer
    return this.tracker.processThought(input);
  }
}
