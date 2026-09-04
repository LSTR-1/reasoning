// ─── Core types barrel ───
// Re-exports all shared types from the 7 reasoning tools.

// collaborative-reasoning
export type {
  Persona,
  Contribution,
  Disagreement,
  CollaborativeReasoningData,
} from "./collaborative-reasoning/types.js";

// constraint-solver
export type { ConstraintProblem, ConstraintResult } from "./constraint-solver/types.js";

// metacognitive-monitoring
export type {
  KnowledgeAssessment,
  ClaimAssessment,
  ReasoningAssessment,
  MetacognitiveMonitoringData,
  MonitoringResult,
} from "./metacognitive-monitoring/types.js";

// narrative-planner
export type { NarrativeInput, NarrativeOutline } from "./narrative-planner/types.js";

// scientific-method
export type {
  Variable,
  HypothesisData,
  Prediction,
  ExperimentData,
  ScientificInquiryData,
} from "./scientific-method/types.js";

// sequential-thinking
export type { ThoughtData, ThinkingProcessResult } from "./sequential-thinking/types.js";

// structured-argumentation
export type {
  ArgumentType,
  ArgumentData,
  RelationshipGraphNode,
  RelationshipGraph,
  ArgumentAnalysis,
} from "./structured-argumentation/types.js";
