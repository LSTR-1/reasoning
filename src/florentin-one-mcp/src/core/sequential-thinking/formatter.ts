import chalk from "chalk";
import { ThoughtData } from "./types.js";

function stripAnsi(str: string): string {
  // Regex to strip ANSI escape codes
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
}

export function formatThought(thoughtData: ThoughtData): string {
  const { thoughtNumber, totalThoughts, thought, isRevision, revisesThought, branchFromThought, branchId } =
    thoughtData;

  let prefix = "";
  let context = "";

  if (isRevision) {
    prefix = chalk.yellow("🔄 Revision");
    context = ` (revising thought ${revisesThought})`;
  } else if (branchFromThought) {
    prefix = chalk.green("🌿 Branch");
    context = ` (from thought ${branchFromThought}, ID: ${branchId})`;
  } else {
    prefix = chalk.blue("💭 Thought");
    context = "";
  }

  const header = `${prefix} ${thoughtNumber}/${totalThoughts}${context}`;
  const headerLength = stripAnsi(header).length;

  // Split thought into lines to handle multi-line content
  const thoughtLines = thought.split("\n");
  const maxLineLength = Math.max(...thoughtLines.map((line) => line.length));

  const contentWidth = Math.max(headerLength, maxLineLength);
  const border = "─".repeat(contentWidth + 2);

  const formattedLines = thoughtLines.map((line) => `│ ${line.padEnd(contentWidth)} │`).join("\n");

  return `
┌${border}┐
│ ${header}${" ".repeat(contentWidth - headerLength)} │
├${border}┤
${formattedLines}
└${border}┘`;
}
