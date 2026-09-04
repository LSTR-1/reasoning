export interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  isRevision?: boolean | undefined;
  revisesThought?: number | undefined;
  branchFromThought?: number | undefined;
  branchId?: string | undefined;
  needsMoreThoughts?: boolean | undefined;
  nextThoughtNeeded: boolean;
}

export interface ThinkingProcessResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
  [key: string]: unknown;
}
