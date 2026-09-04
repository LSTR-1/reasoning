export interface KnowledgeAssessment {
  domain: string;
  knowledgeLevel: "expert" | "proficient" | "familiar" | "basic" | "minimal" | "none";
  confidenceScore: number; // 0.0-1.0
  supportingEvidence: string;
  knownLimitations: string[];
  relevantTrainingCutoff?: string; // e.g., "2021-09"
}

export interface ClaimAssessment {
  claim: string;
  status: "fact" | "inference" | "speculation" | "uncertain";
  confidenceScore: number; // 0.0-1.0
  evidenceBasis: string;
  alternativeInterpretations?: string[];
  falsifiabilityCriteria?: string;
}

export interface ReasoningAssessment {
  step: string;
  potentialBiases: string[];
  assumptions: string[];
  logicalValidity: number; // 0.0-1.0
  inferenceStrength: number; // 0.0-1.0
}

export interface MetacognitiveMonitoringData {
  // Current focus
  task: string;
  stage: "knowledge-assessment" | "planning" | "execution" | "monitoring" | "evaluation" | "reflection";

  // Assessments
  knowledgeAssessment?: KnowledgeAssessment;
  claims?: ClaimAssessment[];
  reasoningSteps?: ReasoningAssessment[];

  // Overall evaluation
  overallConfidence: number; // 0.0-1.0
  uncertaintyAreas: string[];
  recommendedApproach: string;

  // Monitoring metadata
  monitoringId: string;
  iteration: number;

  // Next steps
  nextAssessmentNeeded: boolean;
  suggestedAssessments?: Array<"knowledge" | "claim" | "reasoning" | "overall">;
}

export interface MonitoringResult {
  monitoringId: string;
  task: string;
  stage: MetacognitiveMonitoringData["stage"];
  iteration: number;
  overallConfidence: number;
  hasKnowledgeAssessment: boolean;
  claimCount: number;
  reasoningStepCount: number;
  uncertaintyAreas: number;
  nextAssessmentNeeded: boolean;
  suggestedAssessments?: MetacognitiveMonitoringData["suggestedAssessments"];
}
