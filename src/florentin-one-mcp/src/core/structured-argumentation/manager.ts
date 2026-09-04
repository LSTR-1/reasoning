import { ArgumentData, RelationshipGraph, ArgumentAnalysis, ArgumentType } from "./types.js";
import { formatArgument, getArgumentGraphSummary } from "./formatter.js";

export class ArgumentationManager {
  private argumentHistory: ArgumentData[] = [];
  private relationshipGraph: RelationshipGraph = {};
  private nextArgumentId = 1;

  private validateArgumentData(input: unknown): ArgumentData {
    const data = input as Record<string, unknown>;

    if (!data.claim || typeof data.claim !== "string") {
      throw new Error("Invalid claim: must be a string");
    }

    if (!Array.isArray(data.premises)) {
      throw new Error("Invalid premises: must be an array of strings");
    }

    if (!data.conclusion || typeof data.conclusion !== "string") {
      throw new Error("Invalid conclusion: must be a string");
    }

    if (!data.argumentType || typeof data.argumentType !== "string") {
      throw new Error("Invalid argumentType: must be a string");
    }

    if (typeof data.confidence !== "number" || data.confidence < 0 || data.confidence > 1) {
      throw new Error("Invalid confidence: must be a number between 0 and 1");
    }

    if (typeof data.nextArgumentNeeded !== "boolean") {
      throw new Error("Invalid nextArgumentNeeded: must be a boolean");
    }

    // Base object with required properties
    const validatedData: ArgumentData = {
      claim: data.claim as string,
      premises: data.premises as string[],
      conclusion: data.conclusion as string,
      argumentId: (data.argumentId as string) || `arg-${this.nextArgumentId++}`,
      argumentType: data.argumentType as ArgumentType,
      confidence: data.confidence as number,
      nextArgumentNeeded: typeof data.nextArgumentNeeded === "boolean" ? data.nextArgumentNeeded : true
    };

    // Conditionally add optional properties
    if (data.respondsTo && typeof data.respondsTo === "string") {
      validatedData.respondsTo = data.respondsTo;
    }
    if (Array.isArray(data.supports) && data.supports.length > 0) {
      validatedData.supports = data.supports as string[];
    }
    if (Array.isArray(data.contradicts) && data.contradicts.length > 0) {
      validatedData.contradicts = data.contradicts as string[];
    }
    if (Array.isArray(data.strengths) && data.strengths.length > 0) {
      validatedData.strengths = data.strengths as string[];
    }
    if (Array.isArray(data.weaknesses) && data.weaknesses.length > 0) {
      validatedData.weaknesses = data.weaknesses as string[];
    }
    if (Array.isArray(data.suggestedNextTypes) && data.suggestedNextTypes.length > 0) {
      validatedData.suggestedNextTypes = data.suggestedNextTypes as ArgumentType[];
    }

    return validatedData;
  }

  private updateRelationshipGraph(argument: ArgumentData): void {
    const { argumentId, respondsTo, supports, contradicts } = argument;

    if (!argumentId) return;

    // Initialize this argument's relationships
    if (!this.relationshipGraph[argumentId]) {
      this.relationshipGraph[argumentId] = {
        supports: [],
        contradicts: [],
        respondedBy: []
      };
    }

    // Handle respondsTo relationship
    if (respondsTo && this.relationshipGraph[respondsTo]) {
      this.relationshipGraph[respondsTo].respondedBy.push(argumentId);
    }

    // Handle supports relationships
    if (supports) {
      for (const supportedId of supports) {
        if (this.relationshipGraph[supportedId]) {
          this.relationshipGraph[argumentId].supports.push(supportedId);
        }
      }
    }

    // Handle contradicts relationships
    if (contradicts) {
      for (const contradictedId of contradicts) {
        if (this.relationshipGraph[contradictedId]) {
          this.relationshipGraph[argumentId].contradicts.push(contradictedId);
        }
      }
    }
  }

  public processArgument(input: unknown): ArgumentAnalysis {
    const validatedInput = this.validateArgumentData(input);

    // Add to argument history
    this.argumentHistory.push(validatedInput);

    // Update relationship graph
    this.updateRelationshipGraph(validatedInput);

    // Format the argument for display
    const formattedArgument = formatArgument(validatedInput);
    console.error(formattedArgument);

    // Create graph summary
    const graphSummary = getArgumentGraphSummary(this.argumentHistory, this.relationshipGraph);
    console.error(graphSummary);

    // Determine suggested next steps if not provided
    let suggestedNextTypes = validatedInput.suggestedNextTypes || [];
    if (suggestedNextTypes.length === 0 && validatedInput.nextArgumentNeeded) {
      switch (validatedInput.argumentType) {
        case "thesis":
          suggestedNextTypes = ["antithesis", "objection"];
          break;
        case "antithesis":
          suggestedNextTypes = ["synthesis", "objection"];
          break;
        case "objection":
          suggestedNextTypes = ["rebuttal"];
          break;
        case "rebuttal":
          suggestedNextTypes = ["synthesis"];
          break;
        default:
          suggestedNextTypes = ["thesis", "objection"];
      }
    }

    return {
      argumentId: validatedInput.argumentId!,
      argumentType: validatedInput.argumentType,
      nextArgumentNeeded: validatedInput.nextArgumentNeeded,
      suggestedNextTypes: suggestedNextTypes,
      argumentHistoryLength: this.argumentHistory.length,
      relationshipCount: Object.keys(this.relationshipGraph).length
    };
  }
}
