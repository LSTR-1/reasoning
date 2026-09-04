/**
 * ConstraintProblem - Input structure for constraint satisfaction checking.
 *
 * Purpose: Defines the variables and constraints to be evaluated.
 * Limitations: Max 1000 variables, 5000 constraints.
 * Workflow: 1) Populate variables and constraints 2) Pass to ConstraintSolver.check().
 */
export interface ConstraintProblem {
  variables: Record<string, number>;
  constraints: string[];
}

export interface ConstraintResult {
  satisfied: boolean;
  unsatisfied: string[];
}
