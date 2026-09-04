import { NarrativeInput, NarrativeOutline } from "../../core/narrative-planner/types.js";
import { planNarrative, validateNarrativeInput } from "../../core/narrative-planner/logic.js";

/**
 * AI Tool: Narrative Planner Code Mode API
 * Purpose: Provides programmatic access to narrative planning functionality for integration into applications.
 * Limitations: Generates template-based outlines; requires valid inputs; does not persist state.
 * Workflow: 1. Instantiate class 2. Call planNarrative() with input 3. Receive structured outline
 */
export class NarrativePlanner {
  /**
   * Generates a simple three-act story outline based on the input.
   * @param input The narrative parameters (premise, characters, arcs).
   * @returns The structured narrative outline.
   */
  public planNarrative(input: NarrativeInput): NarrativeOutline {
    const validated = validateNarrativeInput(input);
    return planNarrative(validated);
  }

  /**
   * Batch processes multiple narrative plans.
   * @param inputs Array of narrative inputs.
   * @returns Array of narrative outlines.
   */
  public planNarratives(inputs: NarrativeInput[]): NarrativeOutline[] {
    return inputs.map((input) => this.planNarrative(input));
  }
}
