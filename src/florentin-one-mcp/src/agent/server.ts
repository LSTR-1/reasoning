import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { MetacognitiveCodeMode } from "../codemode/metacognitive-monitoring/index.js";
import { SequentialThinking } from "../codemode/sequential-thinking/index.js";
import { CollaborativeReasoning } from "../codemode/collaborative-reasoning/index.js";
import { ScientificMethodCodeMode } from "../codemode/scientific-method/index.js";
import { StructuredArgumentation } from "../codemode/structured-argumentation/index.js";
import { ConstraintSolver } from "../codemode/constraint-solver/index.js";
import { NarrativePlanner } from "../codemode/narrative-planner/index.js";
import { getPostHogClient, POSTHOG_ANONYMOUS_ID } from "../lib/posthog.js";

const KnowledgeAssessmentSchema = z.object({
  domain: z.string(),
  knowledgeLevel: z.enum(["expert", "proficient", "familiar", "basic", "minimal", "none"]),
  confidenceScore: z.number().min(0).max(1), supportingEvidence: z.string(),
  knownLimitations: z.array(z.string()), relevantTrainingCutoff: z.string().optional()
});
const ClaimAssessmentSchema = z.object({
  claim: z.string(), status: z.enum(["fact", "inference", "speculation", "uncertain"]),
  confidenceScore: z.number().min(0).max(1), evidenceBasis: z.string(),
  alternativeInterpretations: z.array(z.string()).optional(), falsifiabilityCriteria: z.string().optional()
});
const ReasoningStepSchema = z.object({
  step: z.string(), potentialBiases: z.array(z.string()), assumptions: z.array(z.string()),
  logicalValidity: z.number().min(0).max(1), inferenceStrength: z.number().min(0).max(1)
});

const MetacognitiveMonitoringSchema = z.object({
  task: z.string(),
  stage: z.enum(["knowledge-assessment", "planning", "execution", "monitoring", "evaluation", "reflection"]),
  knowledgeAssessment: KnowledgeAssessmentSchema.optional(),
  claims: z.array(ClaimAssessmentSchema).optional(),
  reasoningSteps: z.array(ReasoningStepSchema).optional(),
  overallConfidence: z.number().min(0).max(1), uncertaintyAreas: z.array(z.string()),
  recommendedApproach: z.string(), monitoringId: z.string(), iteration: z.number().min(0),
  nextAssessmentNeeded: z.boolean(),
  suggestedAssessments: z.array(z.enum(["knowledge", "claim", "reasoning", "overall"])).optional()
});

const SequentialThinkingSchema = z.object({
  thought: z.string(), nextThoughtNeeded: z.boolean(),
  thoughtNumber: z.number().int().min(1), totalThoughts: z.number().int().min(1),
  isRevision: z.boolean().optional(), revisesThought: z.number().int().min(1).optional(),
  branchFromThought: z.number().int().min(1).optional(), branchId: z.string().optional(),
  needsMoreThoughts: z.boolean().optional()
});

const CommunicationSchema = z.object({ style: z.string(), tone: z.string() });
const PersonaSchema = z.object({
  id: z.string(), name: z.string(), expertise: z.array(z.string()),
  background: z.string(), perspective: z.string(), biases: z.array(z.string()),
  communication: CommunicationSchema
});
const ContributionSchema = z.object({
  personaId: z.string(), content: z.string(),
  type: z.enum(["observation", "question", "insight", "concern", "suggestion", "challenge", "synthesis"]),
  referenceIds: z.array(z.string()).optional(), confidence: z.number().min(0).max(1)
});
const DPositionSchema = z.object({ personaId: z.string(), position: z.string(), arguments: z.array(z.string()) });
const DResolutionSchema = z.object({ type: z.enum(["consensus", "compromise", "integration", "tabled"]), description: z.string() });
const DisagreementSchema = z.object({ topic: z.string(), positions: z.array(DPositionSchema), resolution: DResolutionSchema.optional() });
const CollaborativeReasoningSchema = z.object({
  topic: z.string(), personas: z.array(PersonaSchema), contributions: z.array(ContributionSchema),
  disagreements: z.array(DisagreementSchema).optional(),
  stage: z.enum(["problem-definition", "ideation", "critique", "integration", "decision", "reflection"]),
  activePersonaId: z.string(), nextPersonaId: z.string().optional(),
  keyInsights: z.array(z.string()).optional(), consensusPoints: z.array(z.string()).optional(),
  openQuestions: z.array(z.string()).optional(), finalRecommendation: z.string().optional(),
  sessionId: z.string(), iteration: z.number().min(0), nextContributionNeeded: z.boolean(),
  suggestedContributionTypes: z.array(z.enum(["observation", "question", "insight", "concern", "suggestion", "challenge", "synthesis"])).optional()
});

const VariableSchema = z.object({ name: z.string(), type: z.enum(["independent", "dependent", "controlled", "confounding"]), operationalization: z.string().optional() });
const HypothesisSchema = z.object({
  statement: z.string(), variables: z.array(VariableSchema), assumptions: z.array(z.string()),
  hypothesisId: z.string(), confidence: z.number().min(0).max(1), domain: z.string(),
  iteration: z.number().min(0), alternativeTo: z.array(z.string()).optional(),
  refinementOf: z.string().optional(), status: z.enum(["proposed", "testing", "supported", "refuted", "refined"])
});
const PredictionSchema = z.object({ if: z.string(), then: z.string(), else: z.string().optional() });
const ExperimentSchema = z.object({
  design: z.string(), methodology: z.string(), predictions: z.array(PredictionSchema),
  experimentId: z.string(), hypothesisId: z.string(), controlMeasures: z.array(z.string()),
  results: z.string().optional(), outcomeMatched: z.boolean().optional(),
  unexpectedObservations: z.array(z.string()).optional(), limitations: z.array(z.string()).optional(),
  nextSteps: z.array(z.string()).optional()
});
const ScientificMethodSchema = z.object({
  stage: z.enum(["observation", "question", "hypothesis", "experiment", "analysis", "conclusion", "iteration"]),
  observation: z.string().optional(), question: z.string().optional(), hypothesis: HypothesisSchema.optional(),
  experiment: ExperimentSchema.optional(), analysis: z.string().optional(), conclusion: z.string().optional(),
  inquiryId: z.string(), iteration: z.number().min(0), nextStageNeeded: z.boolean()
});

const ArgumentTypeEnum = z.enum(["thesis", "antithesis", "synthesis", "objection", "rebuttal"]);
const StructuredArgumentationSchema = z.object({
  claim: z.string(), premises: z.array(z.string()), conclusion: z.string(),
  argumentId: z.string().optional(), argumentType: ArgumentTypeEnum, confidence: z.number().min(0).max(1),
  respondsTo: z.string().optional(), supports: z.array(z.string()).optional(),
  contradicts: z.array(z.string()).optional(), strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(), nextArgumentNeeded: z.boolean(),
  suggestedNextTypes: z.array(ArgumentTypeEnum).optional()
});

const ConstraintSolverSchema = z.object({ variables: z.record(z.string(), z.number()), constraints: z.array(z.string()).min(1) });
const NarrativePlannerSchema = z.object({ premise: z.string().min(1), characters: z.array(z.string()).min(1), arcs: z.array(z.string()).min(1) });

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createServer(): McpServer {
  const server = new McpServer({ name: "florentin-one-mcp", version: "1.0.0" });

  const metacognitive = new MetacognitiveCodeMode();
  const sequentialThinking = new SequentialThinking();
  const collaborativeReasoning = new CollaborativeReasoning();
  const scientificMethod = new ScientificMethodCodeMode();
  const structuredArgumentation = new StructuredArgumentation();
  const constraintSolver = new ConstraintSolver();
  const narrativePlanner = new NarrativePlanner();

  const ph = getPostHogClient;
  const aid = POSTHOG_ANONYMOUS_ID;

  // ---- Tools ----

  server.registerTool("metacognitiveMonitoring", {
    description: "MANDATORY FIRST-STEP TOOL: Systematic self-monitoring framework that MUST be executed first. Establishes calibrated confidence, tracks knowledge boundaries, and identifies reasoning biases.",
    inputSchema: MetacognitiveMonitoringSchema
  }, async (args: Record<string, unknown>) => {
    try {
      const result = await metacognitive.monitor(args as any);
      const p = ph(); if (p) { p.capture({ distinctId: aid, event: "metacognitive assessment completed", properties: { stage: args.stage } }); await p.flush(); }
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      const p = ph(); if (p) { p.captureException(error instanceof Error ? error : new Error(String(error)), aid, { tool: "metacognitiveMonitoring" }); await p.flush(); }
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: error instanceof Error ? error.message : String(error), status: "failed" }, null, 2) }], isError: true };
    }
  });

  server.registerTool("sequentialthinking", {
    description: "A detailed tool for dynamic and reflective problem-solving through thoughts. Each thought can build on, question, or revise previous insights.",
    inputSchema: SequentialThinkingSchema
  }, async (args: Record<string, unknown>) => {
    try {
      const result = sequentialThinking.think(args as any);
      const p = ph(); if (p) { p.capture({ distinctId: aid, event: "sequential thought processed", properties: { thought_number: args.thoughtNumber } }); await p.flush(); }
      return { content: result.content };
    } catch (error) {
      const p = ph(); if (p) { p.captureException(error instanceof Error ? error : new Error(String(error)), aid, { tool: "sequentialthinking" }); await p.flush(); }
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: error instanceof Error ? error.message : String(error), status: "failed" }, null, 2) }], isError: true };
    }
  });

  server.registerTool("collaborativeReasoning", {
    description: "Simulates expert collaboration with diverse perspectives. Coordinates multiple viewpoints for structured collaborative reasoning and perspective integration.",
    inputSchema: CollaborativeReasoningSchema
  }, async (args: Record<string, unknown>) => {
    try {
      const result = await collaborativeReasoning.collaborate(args);
      const p = ph(); if (p) { p.capture({ distinctId: aid, event: "collaborative reasoning step", properties: { session_id: args.sessionId } }); await p.flush(); }
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      const p = ph(); if (p) { p.captureException(error instanceof Error ? error : new Error(String(error)), aid, { tool: "collaborativeReasoning" }); await p.flush(); }
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: error instanceof Error ? error.message : String(error), status: "failed" }, null, 2) }], isError: true };
    }
  });

  server.registerTool("scientificMethod", {
    description: "Applies formal scientific reasoning to questions and problems with structured hypothesis testing, explicit variable identification, and evidence evaluation.",
    inputSchema: ScientificMethodSchema
  }, async (args: Record<string, unknown>) => {
    try {
      const result = await scientificMethod.processInquiry(args);
      const p = ph(); if (p) { p.capture({ distinctId: aid, event: "scientific inquiry processed", properties: { inquiry_id: args.inquiryId } }); await p.flush(); }
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      const p = ph(); if (p) { p.captureException(error instanceof Error ? error : new Error(String(error)), aid, { tool: "scientificMethod" }); await p.flush(); }
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: error instanceof Error ? error.message : String(error), status: "failed" }, null, 2) }], isError: true };
    }
  });

  server.registerTool("structuredArgumentation", {
    description: "Systematic dialectical reasoning and argument analysis. Facilitates creation, critique, and synthesis of competing arguments with thesis-antithesis-synthesis progression.",
    inputSchema: StructuredArgumentationSchema
  }, async (args: Record<string, unknown>) => {
    try {
      const result = await structuredArgumentation.processArgument(args);
      const p = ph(); if (p) { p.capture({ distinctId: aid, event: "argumentation processed", properties: { argument_type: args.argumentType } }); await p.flush(); }
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      const p = ph(); if (p) { p.captureException(error instanceof Error ? error : new Error(String(error)), aid, { tool: "structuredArgumentation" }); await p.flush(); }
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: error instanceof Error ? error.message : String(error), status: "failed" }, null, 2) }], isError: true };
    }
  });

  server.registerTool("constraintSolver", {
    description: "Checks if a set of variables satisfies all constraints",
    inputSchema: ConstraintSolverSchema
  }, async (args: Record<string, unknown>) => {
    try {
      const result = await constraintSolver.check(args as { variables: Record<string, number>; constraints: string[] });
      const p = ph(); if (p) { p.capture({ distinctId: aid, event: "constraint solver checked", properties: {} }); await p.flush(); }
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      const p = ph(); if (p) { p.captureException(error instanceof Error ? error : new Error(String(error)), aid, { tool: "constraintSolver" }); await p.flush(); }
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: error instanceof Error ? error.message : String(error), status: "failed" }, null, 2) }], isError: true };
    }
  });

  server.registerTool("narrativePlanner", {
    description: "Generates a simple three-act story outline",
    inputSchema: NarrativePlannerSchema
  }, async (args: Record<string, unknown>) => {
    try {
      const result = narrativePlanner.planNarrative(args as { premise: string; characters: string[]; arcs: string[] });
      const p = ph(); if (p) { p.capture({ distinctId: aid, event: "narrative planned", properties: {} }); await p.flush(); }
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      const p = ph(); if (p) { p.captureException(error instanceof Error ? error : new Error(String(error)), aid, { tool: "narrativePlanner" }); await p.flush(); }
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: error instanceof Error ? error.message : String(error), status: "failed" }, null, 2) }], isError: true };
    }
  });

  // ---- Prompts ----

  server.registerPrompt("metacognitive-monitoring-workflow", {
    title: "Begin Metacognitive Monitoring (Mandatory First Step)",
    description: "MANDATORY: Execute metacognitive self-assessment before starting any task."
  }, async () => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: "MANDATORY METACOGNITIVE MONITORING WORKFLOW\n===========================================\n\nBefore responding or performing any analysis, call the `metacognitiveMonitoring` tool:\n\nSTEP 1 — Knowledge Assessment (stage: \"knowledge-assessment\")\nSTEP 2 — Planning (stage: \"planning\")\nSTEP 3 — Execution (stage: \"execution\")\nSTEP 4 — Evaluation (stage: \"evaluation\")\n\nCRITICAL: Do NOT skip this workflow."
      }
    }]
  }));

  server.registerPrompt("metacognitive-reassessment", {
    title: "Re-assess Metacognitive State",
    description: "Follow-up metacognitive assessment when domain, complexity, or confidence changes."
  }, async () => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: "METACOGNITIVE RE-ASSESSMENT REQUIRED\n===================================\n\nA re-assessment is needed. Call `metacognitiveMonitoring` with updated stage, confidence, and assessments."
      }
    }]
  }));

  return server;
}
