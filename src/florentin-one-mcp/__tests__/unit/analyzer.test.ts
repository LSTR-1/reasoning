import { MetacognitiveAnalyzer } from "../../src/core/metacognitive-monitoring/analyzer.js";
import { createTestFixture } from "../../../shared/test-utils/index.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validInputFixture = createTestFixture({
  task: "test task",
  stage: "knowledge-assessment" as const,
  overallConfidence: 0.8,
  recommendedApproach: "test approach",
  monitoringId: "mm-test-20260821",
  iteration: 0,
  nextAssessmentNeeded: true,
  uncertaintyAreas: ["area1", "area2"]
});

const validKnowledgeAssessment = {
  domain: "testing",
  knowledgeLevel: "proficient" as const,
  confidenceScore: 0.7,
  supportingEvidence: "test evidence",
  knownLimitations: ["limitation1"]
};

const validClaim = {
  claim: "test claim",
  status: "fact" as const,
  confidenceScore: 0.9,
  evidenceBasis: "test basis"
};

const validReasoningStep = {
  step: "test step",
  potentialBiases: ["bias1"],
  assumptions: ["assumption1"],
  logicalValidity: 0.8,
  inferenceStrength: 0.7
};

// ---------------------------------------------------------------------------
// validateMetacognitiveMonitoringData
// ---------------------------------------------------------------------------

describe("MetacognitiveAnalyzer.validateMetacognitiveMonitoringData()", () => {
  let analyzer: MetacognitiveAnalyzer;

  beforeEach(() => {
    analyzer = new MetacognitiveAnalyzer();
  });

  // --- Valid input ---

  it("valid input passes validation and returns correct shape", () => {
    const input = validInputFixture();
    const result = analyzer.validateMetacognitiveMonitoringData(input);

    expect(result.task).toBe("test task");
    expect(result.stage).toBe("knowledge-assessment");
    expect(result.overallConfidence).toBe(0.8);
    expect(result.recommendedApproach).toBe("test approach");
    expect(result.monitoringId).toBe("mm-test-20260821");
    expect(result.iteration).toBe(0);
    expect(result.nextAssessmentNeeded).toBe(true);
    expect(result.uncertaintyAreas).toEqual(["area1", "area2"]);
  });

  // --- Invalid task ---

  it("throws when task is not a string", () => {
    const input = validInputFixture({ task: 123 as unknown as string });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow("Invalid task: must be a string");
  });

  it("throws when task is missing", () => {
    const { task: _, ...rest } = validInputFixture();
    expect(() => analyzer.validateMetacognitiveMonitoringData(rest)).toThrow("Invalid task: must be a string");
  });

  // --- Invalid stage ---

  it("throws when stage is not in allowed set", () => {
    const input = validInputFixture({ stage: "invalid-stage" as unknown as "knowledge-assessment" });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid stage: must be one of knowledge-assessment|planning|execution|monitoring|evaluation|reflection"
    );
  });

  it("throws when stage is not a string", () => {
    const input = validInputFixture({ stage: 42 as unknown as "knowledge-assessment" });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow("Invalid stage: must be a string");
  });

  // --- Invalid overallConfidence ---

  it("throws when overallConfidence is out of 0-1 range (negative)", () => {
    const input = validInputFixture({ overallConfidence: -0.1 });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid overallConfidence: must be a number between 0 and 1"
    );
  });

  it("throws when overallConfidence is out of 0-1 range (>1)", () => {
    const input = validInputFixture({ overallConfidence: 1.5 });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid overallConfidence: must be a number between 0 and 1"
    );
  });

  it("throws when overallConfidence is not a number", () => {
    const input = validInputFixture({ overallConfidence: "high" as unknown as number });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid overallConfidence: must be a number between 0 and 1"
    );
  });

  // --- Invalid monitoringId ---

  it("throws when monitoringId is not a string", () => {
    const input = validInputFixture({ monitoringId: 123 as unknown as string });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow("Invalid monitoringId: must be a string");
  });

  it("throws when monitoringId is missing", () => {
    const { monitoringId: _, ...rest } = validInputFixture();
    expect(() => analyzer.validateMetacognitiveMonitoringData(rest)).toThrow("Invalid monitoringId: must be a string");
  });

  // --- Invalid recommendedApproach ---

  it("throws when recommendedApproach is not a string", () => {
    const input = validInputFixture({ recommendedApproach: null as unknown as string });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid recommendedApproach: must be a string"
    );
  });

  // --- Invalid iteration ---

  it("throws when iteration is negative", () => {
    const input = validInputFixture({ iteration: -1 });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid iteration: must be a non-negative number"
    );
  });

  it("throws when iteration is not a number", () => {
    const input = validInputFixture({ iteration: "zero" as unknown as number });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid iteration: must be a non-negative number"
    );
  });

  // --- Invalid nextAssessmentNeeded ---

  it("throws when nextAssessmentNeeded is not a boolean", () => {
    const input = validInputFixture({ nextAssessmentNeeded: "yes" as unknown as boolean });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid nextAssessmentNeeded: must be a boolean"
    );
  });

  // --- Invalid uncertaintyAreas ---

  it("throws when uncertaintyAreas is not an array", () => {
    const input = validInputFixture({ uncertaintyAreas: "not-array" as unknown as string[] });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid uncertaintyAreas: must be an array"
    );
  });

  // --- Valid knowledgeAssessment ---

  it("valid knowledgeAssessment sub-object passes", () => {
    const input = validInputFixture({ knowledgeAssessment: validKnowledgeAssessment });
    const result = analyzer.validateMetacognitiveMonitoringData(input);

    expect(result.knowledgeAssessment).toBeDefined();
    expect(result.knowledgeAssessment!.domain).toBe("testing");
    expect(result.knowledgeAssessment!.knowledgeLevel).toBe("proficient");
    expect(result.knowledgeAssessment!.confidenceScore).toBe(0.7);
    expect(result.knowledgeAssessment!.supportingEvidence).toBe("test evidence");
    expect(result.knowledgeAssessment!.knownLimitations).toEqual(["limitation1"]);
  });

  // --- Invalid knowledgeAssessment.knowledgeLevel ---

  it("throws when knowledgeAssessment.knowledgeLevel is invalid", () => {
    const input = validInputFixture({
      knowledgeAssessment: { ...validKnowledgeAssessment, knowledgeLevel: "guru" as unknown as "proficient" }
    });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid knowledgeAssessment.knowledgeLevel: must be one of expert|proficient|familiar|basic|minimal|none"
    );
  });

  it("throws when knowledgeAssessment.domain is missing", () => {
    const { domain: _, ...ka } = validKnowledgeAssessment;
    const input = validInputFixture({ knowledgeAssessment: ka as typeof validKnowledgeAssessment });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid knowledgeAssessment.domain: must be a string"
    );
  });

  it("throws when knowledgeAssessment.confidenceScore is out of range", () => {
    const input = validInputFixture({
      knowledgeAssessment: { ...validKnowledgeAssessment, confidenceScore: 1.5 }
    });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid knowledgeAssessment.confidenceScore: must be a number between 0 and 1"
    );
  });

  it("throws when knowledgeAssessment.supportingEvidence is missing", () => {
    const { supportingEvidence: _, ...ka } = validKnowledgeAssessment;
    const input = validInputFixture({ knowledgeAssessment: ka as typeof validKnowledgeAssessment });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid knowledgeAssessment.supportingEvidence: must be a string"
    );
  });

  it("throws when knowledgeAssessment.knownLimitations is not an array", () => {
    const input = validInputFixture({
      knowledgeAssessment: { ...validKnowledgeAssessment, knownLimitations: "not-array" as unknown as string[] }
    });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid knowledgeAssessment.knownLimitations: must be an array"
    );
  });

  // --- Valid claims array ---

  it("valid claims array passes", () => {
    const input = validInputFixture({ claims: [validClaim] });
    const result = analyzer.validateMetacognitiveMonitoringData(input);

    expect(result.claims).toBeDefined();
    expect(result.claims).toHaveLength(1);
    expect(result.claims![0].claim).toBe("test claim");
    expect(result.claims![0].status).toBe("fact");
    expect(result.claims![0].confidenceScore).toBe(0.9);
    expect(result.claims![0].evidenceBasis).toBe("test basis");
  });

  // --- Invalid claim.status ---

  it("throws when claim.status is invalid", () => {
    const input = validInputFixture({
      claims: [{ ...validClaim, status: "unknown" as unknown as "fact" }]
    });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid claim.status: must be one of fact|inference|speculation|uncertain"
    );
  });

  it("throws when claim.claim is not a string", () => {
    const input = validInputFixture({
      claims: [{ ...validClaim, claim: 123 as unknown as string }]
    });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow("Invalid claim.claim: must be a string");
  });

  it("throws when claim.confidenceScore is out of range", () => {
    const input = validInputFixture({
      claims: [{ ...validClaim, confidenceScore: -0.5 }]
    });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid claim.confidenceScore: must be a number between 0 and 1"
    );
  });

  it("throws when claim.evidenceBasis is not a string", () => {
    const input = validInputFixture({
      claims: [{ ...validClaim, evidenceBasis: null as unknown as string }]
    });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid claim.evidenceBasis: must be a string"
    );
  });

  // --- Valid reasoningSteps array ---

  it("valid reasoningSteps array passes", () => {
    const input = validInputFixture({ reasoningSteps: [validReasoningStep] });
    const result = analyzer.validateMetacognitiveMonitoringData(input);

    expect(result.reasoningSteps).toBeDefined();
    expect(result.reasoningSteps).toHaveLength(1);
    expect(result.reasoningSteps![0].step).toBe("test step");
    expect(result.reasoningSteps![0].potentialBiases).toEqual(["bias1"]);
    expect(result.reasoningSteps![0].assumptions).toEqual(["assumption1"]);
    expect(result.reasoningSteps![0].logicalValidity).toBe(0.8);
    expect(result.reasoningSteps![0].inferenceStrength).toBe(0.7);
  });

  it("throws when reasoningStep.step is not a string", () => {
    const input = validInputFixture({
      reasoningSteps: [{ ...validReasoningStep, step: 123 as unknown as string }]
    });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid reasoningStep.step: must be a string"
    );
  });

  it("throws when reasoningStep.logicalValidity is out of range", () => {
    const input = validInputFixture({
      reasoningSteps: [{ ...validReasoningStep, logicalValidity: 2 }]
    });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid reasoningStep.logicalValidity: must be a number between 0 and 1"
    );
  });

  it("throws when reasoningStep.inferenceStrength is out of range", () => {
    const input = validInputFixture({
      reasoningSteps: [{ ...validReasoningStep, inferenceStrength: -0.1 }]
    });
    expect(() => analyzer.validateMetacognitiveMonitoringData(input)).toThrow(
      "Invalid reasoningStep.inferenceStrength: must be a number between 0 and 1"
    );
  });

  // --- Boundary values ---

  it("accepts overallConfidence at boundary 0", () => {
    const input = validInputFixture({ overallConfidence: 0 });
    const result = analyzer.validateMetacognitiveMonitoringData(input);
    expect(result.overallConfidence).toBe(0);
  });

  it("accepts overallConfidence at boundary 1", () => {
    const input = validInputFixture({ overallConfidence: 1 });
    const result = analyzer.validateMetacognitiveMonitoringData(input);
    expect(result.overallConfidence).toBe(1);
  });

  it("accepts iteration at boundary 0", () => {
    const input = validInputFixture({ iteration: 0 });
    const result = analyzer.validateMetacognitiveMonitoringData(input);
    expect(result.iteration).toBe(0);
  });

  // --- Optional fields omitted ---

  it("accepts input without knowledgeAssessment, claims, reasoningSteps", () => {
    const input = validInputFixture();
    const result = analyzer.validateMetacognitiveMonitoringData(input);

    expect(result.knowledgeAssessment).toBeUndefined();
    expect(result.claims).toBeUndefined();
    expect(result.reasoningSteps).toBeUndefined();
  });

  // --- suggestedAssessments ---

  it("filters suggestedAssessments to only valid values", () => {
    const input = validInputFixture({
      suggestedAssessments: ["knowledge", "invalid" as "knowledge", "claim", "overall"]
    });
    const result = analyzer.validateMetacognitiveMonitoringData(input);

    expect(result.suggestedAssessments).toEqual(["knowledge", "claim", "overall"]);
  });

  // --- relevantTrainingCutoff optional ---

  it("preserves relevantTrainingCutoff when provided", () => {
    const input = validInputFixture({
      knowledgeAssessment: { ...validKnowledgeAssessment, relevantTrainingCutoff: "2021-09" }
    });
    const result = analyzer.validateMetacognitiveMonitoringData(input);

    expect(result.knowledgeAssessment!.relevantTrainingCutoff).toBe("2021-09");
  });

  // --- claim alternativeInterpretations and falsifiabilityCriteria ---

  it("preserves claim alternativeInterpretations and falsifiabilityCriteria", () => {
    const input = validInputFixture({
      claims: [
        {
          ...validClaim,
          alternativeInterpretations: ["alt1", "alt2"],
          falsifiabilityCriteria: "test criteria"
        }
      ]
    });
    const result = analyzer.validateMetacognitiveMonitoringData(input);

    expect(result.claims![0].alternativeInterpretations).toEqual(["alt1", "alt2"]);
    expect(result.claims![0].falsifiabilityCriteria).toBe("test criteria");
  });
});

// ---------------------------------------------------------------------------
// process
// ---------------------------------------------------------------------------

describe("MetacognitiveAnalyzer.process()", () => {
  let analyzer: MetacognitiveAnalyzer;

  beforeEach(() => {
    analyzer = new MetacognitiveAnalyzer();
  });

  it("returns correct MonitoringResult shape", () => {
    const input = validInputFixture({
      knowledgeAssessment: validKnowledgeAssessment,
      claims: [validClaim, { ...validClaim, claim: "second claim" }],
      reasoningSteps: [validReasoningStep]
    });
    const { data, result } = analyzer.process(input);

    expect(result.monitoringId).toBe("mm-test-20260821");
    expect(result.task).toBe("test task");
    expect(result.stage).toBe("knowledge-assessment");
    expect(result.iteration).toBe(0);
    expect(result.overallConfidence).toBe(0.8);
    expect(result.hasKnowledgeAssessment).toBe(true);
    expect(result.claimCount).toBe(2);
    expect(result.reasoningStepCount).toBe(1);
    expect(result.uncertaintyAreas).toBe(2);
    expect(result.nextAssessmentNeeded).toBe(true);
    expect(data).toBeDefined();
  });

  it("tracks claim count correctly when no claims", () => {
    const input = validInputFixture();
    const { result } = analyzer.process(input);

    expect(result.claimCount).toBe(0);
  });

  it("tracks claim count correctly with multiple claims", () => {
    const input = validInputFixture({
      claims: [validClaim, { ...validClaim, claim: "claim 2" }, { ...validClaim, claim: "claim 3" }]
    });
    const { result } = analyzer.process(input);

    expect(result.claimCount).toBe(3);
  });

  it("hasKnowledgeAssessment is false when no knowledgeAssessment", () => {
    const input = validInputFixture();
    const { result } = analyzer.process(input);

    expect(result.hasKnowledgeAssessment).toBe(false);
  });

  it("hasKnowledgeAssessment is true when knowledgeAssessment provided", () => {
    const input = validInputFixture({ knowledgeAssessment: validKnowledgeAssessment });
    const { result } = analyzer.process(input);

    expect(result.hasKnowledgeAssessment).toBe(true);
  });

  it("reasoningStepCount is 0 when no reasoningSteps", () => {
    const input = validInputFixture();
    const { result } = analyzer.process(input);

    expect(result.reasoningStepCount).toBe(0);
  });

  it("updates monitoring history across multiple calls", () => {
    const input1 = validInputFixture({ monitoringId: "mm-session-1", iteration: 0 });
    const input2 = validInputFixture({ monitoringId: "mm-session-1", iteration: 1 });

    analyzer.process(input1);
    const { result } = analyzer.process(input2);

    expect(result.iteration).toBe(1);
  });

  it("tracks separate monitoringIds independently", () => {
    const input1 = validInputFixture({ monitoringId: "mm-session-a", iteration: 0 });
    const input2 = validInputFixture({ monitoringId: "mm-session-b", iteration: 5 });

    const { result: r1 } = analyzer.process(input1);
    const { result: r2 } = analyzer.process(input2);

    expect(r1.monitoringId).toBe("mm-session-a");
    expect(r1.iteration).toBe(0);
    expect(r2.monitoringId).toBe("mm-session-b");
    expect(r2.iteration).toBe(5);
  });

  it("preserves suggestedAssessments in result", () => {
    const input = validInputFixture({ suggestedAssessments: ["knowledge", "claim"] });
    const { result } = analyzer.process(input);

    expect(result.suggestedAssessments).toEqual(["knowledge", "claim"]);
  });

  it("throws on invalid input (validation runs before processing)", () => {
    const input = validInputFixture({ task: 123 as unknown as string });
    expect(() => analyzer.process(input)).toThrow("Invalid task: must be a string");
  });
});