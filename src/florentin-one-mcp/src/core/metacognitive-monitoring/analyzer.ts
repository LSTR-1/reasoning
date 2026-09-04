import {
  MetacognitiveMonitoringData,
  KnowledgeAssessment,
  ClaimAssessment,
  ReasoningAssessment,
  MonitoringResult
} from "./types.js";

export class MetacognitiveAnalyzer {
  private monitoringHistory: Record<string, MetacognitiveMonitoringData[]> = {};
  private knowledgeInventory: Record<string, KnowledgeAssessment> = {};
  private claimRegistry: Record<string, ClaimAssessment> = {};

  public validateMetacognitiveMonitoringData(input: unknown): MetacognitiveMonitoringData {
    const data = input as Record<string, unknown>;

    // Validate required fields
    if (!data.task || typeof data.task !== "string") {
      throw new Error("Invalid task: must be a string");
    }

    if (!data.stage || typeof data.stage !== "string") {
      throw new Error("Invalid stage: must be a string");
    }
    {
      const allowed = new Set([
        "knowledge-assessment",
        "planning",
        "execution",
        "monitoring",
        "evaluation",
        "reflection"
      ]);
      if (!allowed.has(data.stage as string)) {
        throw new Error(
          "Invalid stage: must be one of knowledge-assessment|planning|execution|monitoring|evaluation|reflection"
        );
      }
    }

    if (typeof data.overallConfidence !== "number" || data.overallConfidence < 0 || data.overallConfidence > 1) {
      throw new Error("Invalid overallConfidence: must be a number between 0 and 1");
    }

    if (!data.recommendedApproach || typeof data.recommendedApproach !== "string") {
      throw new Error("Invalid recommendedApproach: must be a string");
    }

    if (!data.monitoringId || typeof data.monitoringId !== "string") {
      throw new Error("Invalid monitoringId: must be a string");
    }

    if (typeof data.iteration !== "number" || data.iteration < 0) {
      throw new Error("Invalid iteration: must be a non-negative number");
    }

    if (typeof data.nextAssessmentNeeded !== "boolean") {
      throw new Error("Invalid nextAssessmentNeeded: must be a boolean");
    }

    if (!Array.isArray(data.uncertaintyAreas)) {
      throw new Error("Invalid uncertaintyAreas: must be an array");
    }

    // Validate knowledge assessment
    let knowledgeAssessment: KnowledgeAssessment | undefined = undefined;
    if (data.knowledgeAssessment && typeof data.knowledgeAssessment === "object") {
      const ka = data.knowledgeAssessment as Record<string, unknown>;

      if (!ka.domain || typeof ka.domain !== "string") {
        throw new Error("Invalid knowledgeAssessment.domain: must be a string");
      }

      if (!ka.knowledgeLevel || typeof ka.knowledgeLevel !== "string") {
        throw new Error("Invalid knowledgeAssessment.knowledgeLevel: must be a string");
      }

      {
        const allowed = new Set(["expert", "proficient", "familiar", "basic", "minimal", "none"]);
        if (!allowed.has(ka.knowledgeLevel as string)) {
          throw new Error(
            "Invalid knowledgeAssessment.knowledgeLevel: must be one of expert|proficient|familiar|basic|minimal|none"
          );
        }
      }

      if (typeof ka.confidenceScore !== "number" || ka.confidenceScore < 0 || ka.confidenceScore > 1) {
        throw new Error("Invalid knowledgeAssessment.confidenceScore: must be a number between 0 and 1");
      }

      if (!ka.supportingEvidence || typeof ka.supportingEvidence !== "string") {
        throw new Error("Invalid knowledgeAssessment.supportingEvidence: must be a string");
      }

      if (!Array.isArray(ka.knownLimitations)) {
        throw new Error("Invalid knowledgeAssessment.knownLimitations: must be an array");
      }

      const knownLimitations: string[] = [];
      for (const limitation of ka.knownLimitations) {
        if (typeof limitation === "string") {
          knownLimitations.push(limitation);
        }
      }

      const baseAssessment: Omit<KnowledgeAssessment, "relevantTrainingCutoff"> &
        Partial<Pick<KnowledgeAssessment, "relevantTrainingCutoff">> = {
        domain: ka.domain as string,
        knowledgeLevel: ka.knowledgeLevel as KnowledgeAssessment["knowledgeLevel"],
        confidenceScore: ka.confidenceScore as number,
        supportingEvidence: ka.supportingEvidence as string,
        knownLimitations
      };

      if (typeof ka.relevantTrainingCutoff === "string") {
        baseAssessment.relevantTrainingCutoff = ka.relevantTrainingCutoff;
      }

      knowledgeAssessment = baseAssessment as KnowledgeAssessment;
    }

    // Validate claims
    const claims: ClaimAssessment[] = [];
    if (Array.isArray(data.claims)) {
      for (const claim of data.claims as Array<Record<string, unknown>>) {
        if (!claim.claim || typeof claim.claim !== "string") {
          throw new Error("Invalid claim.claim: must be a string");
        }

        if (!claim.status || typeof claim.status !== "string") {
          throw new Error("Invalid claim.status: must be a string");
        }
        {
          const allowed = new Set(["fact", "inference", "speculation", "uncertain"]);
          if (!allowed.has(claim.status as string)) {
            throw new Error("Invalid claim.status: must be one of fact|inference|speculation|uncertain");
          }
        }

        if (typeof claim.confidenceScore !== "number" || claim.confidenceScore < 0 || claim.confidenceScore > 1) {
          throw new Error("Invalid claim.confidenceScore: must be a number between 0 and 1");
        }

        if (!claim.evidenceBasis || typeof claim.evidenceBasis !== "string") {
          throw new Error("Invalid claim.evidenceBasis: must be a string");
        }

        const alternativeInterpretations: string[] = [];
        if (Array.isArray(claim.alternativeInterpretations)) {
          for (const interpretation of claim.alternativeInterpretations) {
            if (typeof interpretation === "string") {
              alternativeInterpretations.push(interpretation);
            }
          }
        }

        const baseClaim: Omit<ClaimAssessment, "alternativeInterpretations" | "falsifiabilityCriteria"> &
          Partial<Pick<ClaimAssessment, "alternativeInterpretations" | "falsifiabilityCriteria">> = {
          claim: claim.claim as string,
          status: claim.status as ClaimAssessment["status"],
          confidenceScore: claim.confidenceScore as number,
          evidenceBasis: claim.evidenceBasis as string
        };

        if (alternativeInterpretations.length > 0) {
          baseClaim.alternativeInterpretations = alternativeInterpretations;
        }
        if (typeof claim.falsifiabilityCriteria === "string") {
          baseClaim.falsifiabilityCriteria = claim.falsifiabilityCriteria;
        }

        claims.push(baseClaim as ClaimAssessment);
      }
    }

    // Validate reasoning steps
    const reasoningSteps: ReasoningAssessment[] = [];
    if (Array.isArray(data.reasoningSteps)) {
      for (const step of data.reasoningSteps as Array<Record<string, unknown>>) {
        if (!step.step || typeof step.step !== "string") {
          throw new Error("Invalid reasoningStep.step: must be a string");
        }

        if (!Array.isArray(step.potentialBiases)) {
          throw new Error("Invalid reasoningStep.potentialBiases: must be an array");
        }

        if (!Array.isArray(step.assumptions)) {
          throw new Error("Invalid reasoningStep.assumptions: must be an array");
        }

        if (typeof step.logicalValidity !== "number" || step.logicalValidity < 0 || step.logicalValidity > 1) {
          throw new Error("Invalid reasoningStep.logicalValidity: must be a number between 0 and 1");
        }

        if (typeof step.inferenceStrength !== "number" || step.inferenceStrength < 0 || step.inferenceStrength > 1) {
          throw new Error("Invalid reasoningStep.inferenceStrength: must be a number between 0 and 1");
        }

        const potentialBiases: string[] = [];
        for (const bias of step.potentialBiases) {
          if (typeof bias === "string") {
            potentialBiases.push(bias);
          }
        }

        const assumptions: string[] = [];
        for (const assumption of step.assumptions) {
          if (typeof assumption === "string") {
            assumptions.push(assumption);
          }
        }

        reasoningSteps.push({
          step: step.step as string,
          potentialBiases,
          assumptions,
          logicalValidity: step.logicalValidity as number,
          inferenceStrength: step.inferenceStrength as number
        });
      }
    }

    // Process uncertainty areas
    const uncertaintyAreas: string[] = [];
    for (const area of data.uncertaintyAreas) {
      if (typeof area === "string") {
        uncertaintyAreas.push(area);
      }
    }

    // Process suggested assessments
    const suggestedAssessments: MetacognitiveMonitoringData["suggestedAssessments"] = [];
    if (Array.isArray(data.suggestedAssessments)) {
      for (const assessment of data.suggestedAssessments) {
        if (typeof assessment === "string" && ["knowledge", "claim", "reasoning", "overall"].includes(assessment)) {
          suggestedAssessments.push(assessment as "knowledge" | "claim" | "reasoning" | "overall");
        }
      }
    }

    const validatedData: Omit<
      MetacognitiveMonitoringData,
      "knowledgeAssessment" | "claims" | "reasoningSteps" | "suggestedAssessments"
    > &
      Partial<
        Pick<MetacognitiveMonitoringData, "knowledgeAssessment" | "claims" | "reasoningSteps" | "suggestedAssessments">
      > = {
      task: data.task as string,
      stage: data.stage as MetacognitiveMonitoringData["stage"],
      overallConfidence: data.overallConfidence as number,
      uncertaintyAreas,
      recommendedApproach: data.recommendedApproach as string,
      monitoringId: data.monitoringId as string,
      iteration: data.iteration as number,
      nextAssessmentNeeded: data.nextAssessmentNeeded as boolean
    };

    if (knowledgeAssessment) {
      validatedData.knowledgeAssessment = knowledgeAssessment;
    }
    if (claims.length > 0) {
      validatedData.claims = claims;
    }
    if (reasoningSteps.length > 0) {
      validatedData.reasoningSteps = reasoningSteps;
    }
    if (suggestedAssessments.length > 0) {
      validatedData.suggestedAssessments = suggestedAssessments;
    }

    return validatedData as MetacognitiveMonitoringData;
  }

  private updateRegistries(data: MetacognitiveMonitoringData): void {
    if (data.knowledgeAssessment) {
      this.knowledgeInventory[data.knowledgeAssessment.domain] = data.knowledgeAssessment;
    }

    if (data.claims) {
      for (const claim of data.claims) {
        this.claimRegistry[claim.claim] = claim;
      }
    }
  }

  private updateMonitoringHistory(data: MetacognitiveMonitoringData): void {
    if (!this.monitoringHistory[data.monitoringId]) {
      this.monitoringHistory[data.monitoringId] = [];
    }

    this.monitoringHistory[data.monitoringId].push(data);
    this.updateRegistries(data);
  }

  public process(input: unknown): { data: MetacognitiveMonitoringData; result: MonitoringResult } {
    const validatedInput = this.validateMetacognitiveMonitoringData(input);
    this.updateMonitoringHistory(validatedInput);

    const result: MonitoringResult = {
      monitoringId: validatedInput.monitoringId,
      task: validatedInput.task,
      stage: validatedInput.stage,
      iteration: validatedInput.iteration,
      overallConfidence: validatedInput.overallConfidence,
      hasKnowledgeAssessment: !!validatedInput.knowledgeAssessment,
      claimCount: validatedInput.claims?.length || 0,
      reasoningStepCount: validatedInput.reasoningSteps?.length || 0,
      uncertaintyAreas: validatedInput.uncertaintyAreas.length,
      nextAssessmentNeeded: validatedInput.nextAssessmentNeeded,
      suggestedAssessments: validatedInput.suggestedAssessments
    };

    return { data: validatedInput, result };
  }
}
