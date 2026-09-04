import { ConstraintProblem, ConstraintResult } from "../../core/constraint-solver/types.js";
import { solve } from "../../core/constraint-solver/logic.js";

/**
 * ConstraintSolver - Public API for constraint satisfaction checking.
 *
 * Purpose: Validates variable assignments against constraint expressions.
 * Limitations: Max 1000 variables, 5000 constraints. Sandboxed evaluation.
 * Workflow: 1) Provide variables and constraints 2) Call check() 3) Review results.
 */
export class ConstraintSolver {
  /**
   * Checks if a set of variables satisfies all constraints.
   *
   * @param input - The problem definition containing variables and constraints.
   * @returns A promise resolving to the result of the constraint check.
   */
  async check(input: ConstraintProblem): Promise<ConstraintResult> {
    return solve(input);
  }
}
