import chalk from "chalk";
import { ArgumentData, RelationshipGraph } from "./types.js";

export function formatArgument(argument: ArgumentData): string {
  const { argumentId, argumentType, claim, premises, conclusion, confidence, strengths, weaknesses } = argument;

  let typeColor: (text: string) => string;
  let typeText: string;

  switch (argumentType) {
    case "thesis":
      typeColor = chalk.blue;
      typeText = "📝 THESIS";
      break;
    case "antithesis":
      typeColor = chalk.red;
      typeText = "⚔️ ANTITHESIS";
      break;
    case "synthesis":
      typeColor = chalk.green;
      typeText = "🔄 SYNTHESIS";
      break;
    case "objection":
      typeColor = chalk.yellow;
      typeText = "⚠️ OBJECTION";
      break;
    case "rebuttal":
      typeColor = chalk.magenta;
      typeText = "🛡️ REBUTTAL";
      break;
    default:
      typeColor = chalk.white;
      typeText = "ARGUMENT";
  }

  const confidenceDisplay = chalk.gray(`Confidence: ${(confidence * 100).toFixed(0)}%`);
  const header = `${typeColor(typeText)} ${argumentId} ${confidenceDisplay}`;

  let output = `\n┌${"─".repeat(80)}┐\n`;
  output += `│ ${header.padEnd(78)} │\n`;
  output += `├${"─".repeat(80)}┤\n`;
  output += `│ ${chalk.bold("Claim:")} ${claim.slice(0, 71).padEnd(71)} │\n`;

  output += `│ ${chalk.bold("Premises:")}${" ".repeat(70)} │\n`;
  for (const premise of premises) {
    output += `│ • ${premise.slice(0, 76).padEnd(76)} │\n`;
  }

  output += `│ ${chalk.bold("Conclusion:")} ${conclusion.slice(0, 67).padEnd(67)} │\n`;

  if (strengths && strengths.length > 0) {
    output += `│ ${chalk.bold("Strengths:")}${" ".repeat(69)} │\n`;
    for (const strength of strengths) {
      output += `│ + ${strength.slice(0, 76).padEnd(76)} │\n`;
    }
  }

  if (weaknesses && weaknesses.length > 0) {
    output += `│ ${chalk.bold("Weaknesses:")}${" ".repeat(68)} │\n`;
    for (const weakness of weaknesses) {
      output += `│ - ${weakness.slice(0, 76).padEnd(76)} │\n`;
    }
  }

  output += `└${"─".repeat(80)}┘`;

  return output;
}

export function getArgumentGraphSummary(argumentHistory: ArgumentData[], relationshipGraph: RelationshipGraph): string {
  if (argumentHistory.length === 0) {
    return "No arguments in history.";
  }

  const nodes = Object.keys(relationshipGraph);
  let output = `\n${chalk.bold("Argument Relationship Graph")}\n\n`;

  for (const nodeId of nodes) {
    const relationships = relationshipGraph[nodeId];

    const nodeArg = argumentHistory.find((arg) => arg.argumentId === nodeId);
    const nodeType = nodeArg?.argumentType || "unknown";

    let typeDisplay: string;
    switch (nodeType) {
      case "thesis":
        typeDisplay = chalk.blue("Thesis");
        break;
      case "antithesis":
        typeDisplay = chalk.red("Antithesis");
        break;
      case "synthesis":
        typeDisplay = chalk.green("Synthesis");
        break;
      case "objection":
        typeDisplay = chalk.yellow("Objection");
        break;
      case "rebuttal":
        typeDisplay = chalk.magenta("Rebuttal");
        break;
      default:
        typeDisplay = "Unknown";
    }

    output += `${nodeId} (${typeDisplay}):\n`;

    if (relationships.supports.length > 0) {
      output += `  Supports: ${relationships.supports.join(", ")}\n`;
    }

    if (relationships.contradicts.length > 0) {
      output += `  Contradicts: ${relationships.contradicts.join(", ")}\n`;
    }

    if (relationships.respondedBy.length > 0) {
      output += `  Responded by: ${relationships.respondedBy.join(", ")}\n`;
    }

    output += "\n";
  }

  return output;
}
