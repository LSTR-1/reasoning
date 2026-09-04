import { NarrativeInput, NarrativeOutline } from "./types.js";

/**
 * AI Tool: Narrative Input Validator
 * Purpose: Validates and sanitizes user input for narrative planning requests.
 * Limitations: Assumes English text; does not validate semantic coherence of inputs.
 * Workflow: 1. Validate object structure 2. Validate premise field 3. Validate characters array 4. Validate arcs array
 */
export function validateNarrativeInput(input: unknown): NarrativeInput {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid input: must be an object");
  }
  const data = input as Partial<NarrativeInput>;

  if (typeof data.premise !== "string" || !data.premise.trim()) {
    throw new Error("Invalid input: premise must be a non-empty string");
  }
  if (
    !Array.isArray(data.characters) ||
    data.characters.length === 0 ||
    !data.characters.every((c) => typeof c === "string")
  ) {
    throw new Error("Invalid input: characters must be a non-empty array of strings");
  }
  const validChars = data.characters.filter((c) => c.trim().length > 0);
  if (validChars.length === 0) {
    throw new Error("Invalid input: characters must contain at least one non-empty string");
  }

  if (!Array.isArray(data.arcs) || data.arcs.length === 0 || !data.arcs.every((a) => typeof a === "string")) {
    throw new Error("Invalid input: arcs must be a non-empty array of strings");
  }
  const validArcs = data.arcs.filter((a) => a.trim().length > 0);
  if (validArcs.length === 0) {
    throw new Error("Invalid input: arcs must contain at least one non-empty string");
  }

  return data as NarrativeInput;
}

/**
 * AI Tool: Narrative Planner
 * Purpose: Generates a simple three-act story outline from validated narrative inputs.
 * Limitations: Creates basic template-based outlines; does not use AI for creative generation.
 * Workflow: 1. Format characters into comma-separated list 2. Extract setup from premise 3. Map arcs to conflicts 4. Generate resolution text
 */
export function planNarrative(data: NarrativeInput): NarrativeOutline {
  const chars = data.characters
    .map((c) => c.trim())
    .filter(Boolean)
    .join(", ");

  return {
    setup: data.premise.trim(),
    conflicts: data.arcs.map((a) => a.trim()).filter(Boolean),
    resolution: `Characters ${chars} resolve the plot.`
  };
}
