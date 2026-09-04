export interface Persona {
  id: string;
  name: string;
  expertise: string[];
  background: string;
  perspective: string;
  biases: string[];
  communication: {
    style: string;
    tone: string;
  };
}

export interface Contribution {
  personaId: string;
  content: string;
  type: "observation" | "question" | "insight" | "concern" | "suggestion" | "challenge" | "synthesis";
  referenceIds?: string[]; // IDs of previous contributions this builds upon
  confidence: number; // 0.0-1.0
}

export interface Disagreement {
  topic: string;
  positions: Array<{
    personaId: string;
    position: string;
    arguments: string[];
  }>;
  resolution?: {
    type: "consensus" | "compromise" | "integration" | "tabled";
    description: string;
  };
}

export interface CollaborativeReasoningData {
  // Core collaboration components
  topic: string;
  personas: Persona[];
  contributions: Contribution[];
  disagreements?: Disagreement[];

  // Process structure
  stage: "problem-definition" | "ideation" | "critique" | "integration" | "decision" | "reflection";
  activePersonaId: string;
  nextPersonaId?: string;

  // Collaboration output
  keyInsights?: string[];
  consensusPoints?: string[];
  openQuestions?: string[];
  finalRecommendation?: string;

  // Process metadata
  sessionId: string;
  iteration: number;

  // Next steps
  nextContributionNeeded: boolean;
  suggestedContributionTypes?: string[];
}
