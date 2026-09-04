export interface Variable {
  name: string;
  type: "independent" | "dependent" | "controlled" | "confounding";
  operationalization?: string;
}

export interface HypothesisData {
  // Core hypothesis components
  statement: string;
  variables: Variable[];
  assumptions: string[];

  // Hypothesis metadata
  hypothesisId: string;
  confidence: number; // 0.0-1.0
  domain: string;
  iteration: number;

  // Relationships
  alternativeTo?: string[]; // IDs of competing hypotheses
  refinementOf?: string; // ID of parent hypothesis

  // Current status
  status: "proposed" | "testing" | "supported" | "refuted" | "refined";
}

export interface Prediction {
  if: string;
  then: string;
  else?: string;
}

export interface ExperimentData {
  // Core experiment components
  design: string;
  methodology: string;
  predictions: Prediction[];

  // Experiment metadata
  experimentId: string;
  hypothesisId: string;
  controlMeasures: string[];

  // Results (if conducted)
  results?: string;
  outcomeMatched?: boolean;
  unexpectedObservations?: string[];

  // Evaluation
  limitations?: string[];
  nextSteps?: string[];
}

export interface ScientificInquiryData {
  // Process stage
  stage: "observation" | "question" | "hypothesis" | "experiment" | "analysis" | "conclusion" | "iteration";

  // Content for current stage
  observation?: string;
  question?: string;
  hypothesis?: HypothesisData;
  experiment?: ExperimentData;
  analysis?: string;
  conclusion?: string;

  // Process metadata
  inquiryId: string;
  iteration: number;

  // Next steps
  nextStageNeeded: boolean;
}
