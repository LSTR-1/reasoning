/**
 * Core constraint evaluation logic.
 * Purpose: Evaluates mathematical/logical constraints against variable assignments.
 * Limitations: Max 1000 variables, 5000 constraints. Invalid expressions return false.
 * Workflow: Parse constraints with expr-eval, evaluate against provided variables.
 */
import { Parser } from "expr-eval";
import { ConstraintProblem, ConstraintResult } from "./types.js";

export function evaluateConstraint(expr: string, vars: Record<string, number>): boolean {
  try {
    // Replace C-style operators with expr-eval keywords
    const sanitizedExpr = expr.replace(/&&/g, " and ").replace(/\|\|/g, " or ");
    const ast = Parser.parse(sanitizedExpr);
    return Boolean(ast.evaluate(vars));
  } catch {
    return false;
  }
}

export function solve(input: ConstraintProblem): ConstraintResult {
  // Guardrails: prevent too-large inputs from causing performance explosions
  if (Object.keys(input.variables).length > 1000) {
    return { satisfied: false, unsatisfied: ["Too many variables (>1000)"] };
  }
  if (input.constraints.length > 5000) {
    return { satisfied: false, unsatisfied: ["Too many constraints (>5000)"] };
  }

  const unsatisfied = input.constraints.filter((c) => !evaluateConstraint(c, input.variables));
  return { satisfied: unsatisfied.length === 0, unsatisfied };
}
