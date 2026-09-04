export type ArgumentType = "thesis" | "antithesis" | "synthesis" | "objection" | "rebuttal";

export interface ArgumentData {
  // Core argument components
  claim: string;
  premises: string[];
  conclusion: string;

  // Argument metadata
  argumentId?: string;
  argumentType: ArgumentType;
  confidence: number; // 0.0-1.0

  // Relationship to other arguments
  respondsTo?: string; // ID of argument this responds to
  supports?: string[]; // IDs of arguments this supports
  contradicts?: string[]; // IDs of arguments this contradicts

  // Evaluation
  strengths?: string[];
  weaknesses?: string[];

  // Next steps
  nextArgumentNeeded: boolean;
  suggestedNextTypes?: ArgumentType[];
}

export interface RelationshipGraphNode {
  supports: string[];
  contradicts: string[];
  respondedBy: string[];
}

export type RelationshipGraph = Record<string, RelationshipGraphNode>;

export interface ArgumentAnalysis {
  argumentId: string;
  argumentType: ArgumentType;
  nextArgumentNeeded: boolean;
  suggestedNextTypes: ArgumentType[];
  argumentHistoryLength: number;
  relationshipCount: number;
}
