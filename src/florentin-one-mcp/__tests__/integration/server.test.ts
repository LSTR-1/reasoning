import { MetacognitiveCodeMode } from "../../src/codemode/metacognitive-monitoring/index.js";
import { SequentialThinking } from "../../src/codemode/sequential-thinking/index.js";
import { CollaborativeReasoning } from "../../src/codemode/collaborative-reasoning/index.js";
import { ScientificMethodCodeMode } from "../../src/codemode/scientific-method/index.js";
import { StructuredArgumentation } from "../../src/codemode/structured-argumentation/index.js";
import { ConstraintSolver } from "../../src/codemode/constraint-solver/index.js";
import { NarrativePlanner } from "../../src/codemode/narrative-planner/index.js";
import { assertMCPResponse } from "../../../shared/test-utils/index.js";

// ---------------------------------------------------------------------------
// Tests — validates that all 7 codemode classes integrate correctly
// with their core logic modules and produce valid MCP-shaped responses.
// ---------------------------------------------------------------------------

describe("MCP Codemode Integration", () => {
  // --- metacognitiveMonitoring ---

  describe("MetacognitiveCodeMode", () => {
    const codemode = new MetacognitiveCodeMode();

    it("returns valid monitoring result for well-formed input", async () => {
      const result = await codemode.monitor({
        task: "integration test",
        stage: "knowledge-assessment",
        overallConfidence: 0.8,
        uncertaintyAreas: ["test area"],
        recommendedApproach: "test approach",
        monitoringId: "mm-integration-20260821",
        iteration: 0,
        nextAssessmentNeeded: true
      });

      expect(result.monitoringId).toBe("mm-integration-20260821");
      expect(result.overallConfidence).toBe(0.8);
      expect(result.hasKnowledgeAssessment).toBe(false);
      expect(result.claimCount).toBe(0);
    });

    it("tracks knowledge assessment when provided", async () => {
      const result = await codemode.monitor({
        task: "test with knowledge",
        stage: "knowledge-assessment",
        overallConfidence: 0.7,
        uncertaintyAreas: [],
        recommendedApproach: "test",
        monitoringId: "mm-ka-test",
        iteration: 0,
        nextAssessmentNeeded: false,
        knowledgeAssessment: {
          domain: "testing",
          knowledgeLevel: "proficient",
          confidenceScore: 0.7,
          supportingEvidence: "test evidence",
          knownLimitations: ["limitation1"]
        }
      });

      expect(result.hasKnowledgeAssessment).toBe(true);
    });

    it("throws on invalid input (non-string task)", async () => {
      await expect(
        codemode.monitor({
          task: 123 as unknown as string,
          stage: "knowledge-assessment",
          overallConfidence: 0.8,
          uncertaintyAreas: [],
          recommendedApproach: "test",
          monitoringId: "mm-error",
          iteration: 0,
          nextAssessmentNeeded: true
        })
      ).rejects.toThrow();
    });
  });

  // --- sequentialthinking ---

  describe("SequentialThinking", () => {
    const codemode = new SequentialThinking();

    it("returns valid thought result for well-formed input", () => {
      const result = codemode.think({
        thought: "integration test thought",
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      const parsed = assertMCPResponse(result);
      expect((parsed as Record<string, unknown>).thoughtNumber).toBe(1);
      expect((parsed as Record<string, unknown>).totalThoughts).toBe(3);
      expect((parsed as Record<string, unknown>).nextThoughtNeeded).toBe(true);
    });

    it("returns error result for invalid input", () => {
      const result = codemode.think({
        thought: "",
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      expect(result.isError).toBe(true);
    });
  });

  // --- collaborativeReasoning ---

  describe("CollaborativeReasoning", () => {
    const codemode = new CollaborativeReasoning();

    it("returns valid collaboration result", async () => {
      const result = await codemode.collaborate({
        topic: "integration test",
        personas: [
          {
            id: "p1",
            name: "Tester",
            expertise: ["testing"],
            background: "QA engineer",
            perspective: "quality assurance",
            biases: [],
            communication: { style: "direct", tone: "neutral" }
          }
        ],
        contributions: [
          {
            personaId: "p1",
            content: "This is a test contribution",
            type: "observation",
            confidence: 0.9
          }
        ],
        stage: "ideation",
        activePersonaId: "p1",
        sessionId: "cr-integration-test",
        iteration: 0,
        nextContributionNeeded: false
      });

      expect(result).toBeDefined();
      expect(result.sessionId).toBe("cr-integration-test");
    });
  });

  // --- scientificMethod ---

  describe("ScientificMethodCodeMode", () => {
    const codemode = new ScientificMethodCodeMode();

    it("returns valid inquiry result", async () => {
      const result = await codemode.processInquiry({
        stage: "observation",
        observation: "test observation",
        inquiryId: "sm-integration-test",
        iteration: 0,
        nextStageNeeded: false
      });

      expect(result).toBeDefined();
      expect(result.inquiryId).toBe("sm-integration-test");
    });
  });

  // --- structuredArgumentation ---

  describe("StructuredArgumentation", () => {
    const codemode = new StructuredArgumentation();

    it("returns valid argument result", async () => {
      const result = await codemode.processArgument({
        claim: "Testing is valuable",
        premises: ["Tests catch bugs", "Tests document behavior"],
        conclusion: "We should write tests",
        argumentType: "thesis",
        confidence: 0.9,
        nextArgumentNeeded: false
      });

      expect(result).toBeDefined();
      expect(result.argumentId).toBeDefined();
      expect(result.argumentType).toBe("thesis");
    });
  });

  // --- constraintSolver ---

  describe("ConstraintSolver", () => {
    const codemode = new ConstraintSolver();

    it("returns valid constraint check result", async () => {
      const result = await codemode.check({
        variables: { x: 5, y: 10 },
        constraints: ["x > 0", "y > x"]
      });

      expect(result).toBeDefined();
      expect(result.satisfied).toBe(true);
    });

    it("detects unsatisfied constraints", async () => {
      const result = await codemode.check({
        variables: { x: 5, y: 3 },
        constraints: ["y > x"]
      });

      expect(result.satisfied).toBe(false);
    });
  });

  // --- narrativePlanner ---

  describe("NarrativePlanner", () => {
    const codemode = new NarrativePlanner();

    it("returns valid narrative plan", () => {
      const result = codemode.planNarrative({
        premise: "A test story",
        characters: ["Hero", "Villain"],
        arcs: ["Hero overcomes challenge"]
      });

      expect(result).toBeDefined();
      expect(result.setup).toBeDefined();
      expect(result.resolution).toBeDefined();
    });
  });
});
