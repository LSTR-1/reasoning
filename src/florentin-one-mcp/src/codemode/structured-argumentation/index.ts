import { ArgumentationManager } from "../../core/structured-argumentation/manager.js";
import { ArgumentAnalysis, ArgumentData, ArgumentType } from "../../core/structured-argumentation/types.js";

export class StructuredArgumentation {
  private manager: ArgumentationManager;

  constructor() {
    this.manager = new ArgumentationManager();
  }

  /**
   * Processes an argument input, updates the internal state, and returns analysis.
   *
   * @param input - The argument data to process.
   * @returns The analysis of the argument.
   */
  public async processArgument(input: unknown): Promise<ArgumentAnalysis> {
    return this.manager.processArgument(input);
  }
}

export type { ArgumentAnalysis, ArgumentData, ArgumentType };
