import { CollaborativeReasoningManager } from "../../core/collaborative-reasoning/logic.js";
import { CollaborativeReasoningData } from "../../core/collaborative-reasoning/types.js";

export class CollaborativeReasoning {
  private manager: CollaborativeReasoningManager;

  constructor() {
    this.manager = new CollaborativeReasoningManager();
  }

  /**
   * Process a collaborative reasoning step.
   * Validates the input, updates the session history, and determines the next persona if needed.
   *
   * @param input The collaborative reasoning data state
   * @returns The updated collaborative reasoning data
   */
  public async collaborate(input: unknown): Promise<CollaborativeReasoningData> {
    const validatedInput = this.manager.validateCollaborativeReasoningData(input);

    // Update the next persona if not specified
    if (!validatedInput.nextPersonaId && validatedInput.nextContributionNeeded) {
      validatedInput.nextPersonaId = this.manager.selectNextPersona(validatedInput);
    }

    // Update session state
    this.manager.updateSessionHistory(validatedInput);

    return validatedInput;
  }

  /**
   * Generate a text visualization of the collaborative reasoning state.
   *
   * @param data The collaborative reasoning data
   * @returns A string representation of the state suitable for console output
   */
  public visualize(data: CollaborativeReasoningData): string {
    return this.manager.visualizeCollaborativeReasoning(data);
  }
}
