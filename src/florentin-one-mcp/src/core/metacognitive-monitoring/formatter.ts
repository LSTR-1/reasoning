import chalk from "chalk";
import { MetacognitiveMonitoringData } from "./types.js";

export class MetacognitiveFormatter {
  private static getKnowledgeLevelColor(level: string): (text: string) => string {
    switch (level) {
      case "expert":
        return chalk.green;
      case "proficient":
        return chalk.cyan;
      case "familiar":
        return chalk.blue;
      case "basic":
        return chalk.yellow;
      case "minimal":
        return chalk.red;
      case "none":
        return chalk.gray;
      default:
        return chalk.white;
    }
  }

  private static getClaimStatusColor(status: string): (text: string) => string {
    switch (status) {
      case "fact":
        return chalk.green;
      case "inference":
        return chalk.blue;
      case "speculation":
        return chalk.yellow;
      case "uncertain":
        return chalk.red;
      default:
        return chalk.white;
    }
  }

  private static getConfidenceBar(confidence: number): string {
    const barLength = 20;
    const filledLength = Math.round(confidence * barLength);
    const emptyLength = barLength - filledLength;

    let bar = "[";

    // Choose color based on confidence level
    let color: (text: string) => string;
    if (confidence >= 0.8) {
      color = chalk.green;
    } else if (confidence >= 0.5) {
      color = chalk.yellow;
    } else {
      color = chalk.red;
    }

    bar += color("=".repeat(filledLength));
    bar += " ".repeat(emptyLength);
    bar += `] ${(confidence * 100).toFixed(0)}%`;

    return bar;
  }

  public static visualize(data: MetacognitiveMonitoringData): string {
    let output = `\n${chalk.bold(`METACOGNITIVE MONITORING: ${data.task}`)} (ID: ${data.monitoringId})\n\n`;

    // Stage and iteration
    output += `${chalk.cyan("Stage:")} ${data.stage}\n`;
    output += `${chalk.cyan("Iteration:")} ${data.iteration}\n`;
    output += `${chalk.cyan("Overall Confidence:")} ${this.getConfidenceBar(data.overallConfidence)}\n\n`;

    // Knowledge assessment
    if (data.knowledgeAssessment) {
      const ka = data.knowledgeAssessment;
      const levelColor = this.getKnowledgeLevelColor(ka.knowledgeLevel);

      output += `${chalk.bold("KNOWLEDGE ASSESSMENT:")}\n`;
      output += `${chalk.yellow("Domain:")} ${ka.domain}\n`;
      output += `${chalk.yellow("Knowledge Level:")} ${levelColor(ka.knowledgeLevel)}\n`;
      output += `${chalk.yellow("Confidence:")} ${this.getConfidenceBar(ka.confidenceScore)}\n`;
      output += `${chalk.yellow("Evidence:")} ${ka.supportingEvidence}\n`;

      if (ka.relevantTrainingCutoff) {
        output += `${chalk.yellow("Training Cutoff:")} ${ka.relevantTrainingCutoff}\n`;
      }

      output += `${chalk.yellow("Known Limitations:")}\n`;
      for (const limitation of ka.knownLimitations) {
        output += `  - ${limitation}\n`;
      }
      output += "\n";
    }

    // Claims assessment
    if (data.claims && data.claims.length > 0) {
      output += `${chalk.bold("CLAIM ASSESSMENTS:")}\n`;

      for (const claim of data.claims) {
        const statusColor = this.getClaimStatusColor(claim.status);

        output += `${chalk.bold(claim.claim)}\n`;
        output += `  Status: ${statusColor(claim.status)}\n`;
        output += `  Confidence: ${this.getConfidenceBar(claim.confidenceScore)}\n`;
        output += `  Evidence: ${claim.evidenceBasis}\n`;

        if (claim.alternativeInterpretations && claim.alternativeInterpretations.length > 0) {
          output += `  Alternative Interpretations:\n`;
          for (const interpretation of claim.alternativeInterpretations) {
            output += `    - ${interpretation}\n`;
          }
        }

        if (claim.falsifiabilityCriteria) {
          output += `  Falsifiability: ${claim.falsifiabilityCriteria}\n`;
        }

        output += "\n";
      }
    }

    // Reasoning assessment
    if (data.reasoningSteps && data.reasoningSteps.length > 0) {
      output += `${chalk.bold("REASONING ASSESSMENT:")}\n`;

      for (let i = 0; i < data.reasoningSteps.length; i++) {
        const step = data.reasoningSteps[i];
        output += `${chalk.cyan(`Step ${i + 1}:`)} ${step.step}\n`;

        output += `  Logical Validity: ${this.getConfidenceBar(step.logicalValidity)}\n`;
        output += `  Inference Strength: ${this.getConfidenceBar(step.inferenceStrength)}\n`;

        if (step.potentialBiases.length > 0) {
          output += `  Potential Biases:\n`;
          for (const bias of step.potentialBiases) {
            output += `    - ${bias}\n`;
          }
        }

        if (step.assumptions.length > 0) {
          output += `  Assumptions:\n`;
          for (const assumption of step.assumptions) {
            output += `    - ${assumption}\n`;
          }
        }

        output += "\n";
      }
    }

    // Uncertainty areas
    if (data.uncertaintyAreas.length > 0) {
      output += `${chalk.bold("UNCERTAINTY AREAS:")}\n`;
      for (const area of data.uncertaintyAreas) {
        output += `  - ${area}\n`;
      }
      output += "\n";
    }

    // Recommended approach
    output += `${chalk.bold("RECOMMENDED APPROACH:")}\n`;
    output += `  ${data.recommendedApproach}\n\n`;

    // Next steps
    if (data.nextAssessmentNeeded) {
      output += `${chalk.blue("SUGGESTED NEXT ASSESSMENTS:")}\n`;
      const assessments = data.suggestedAssessments || [];
      if (assessments.length > 0) {
        for (const assessment of assessments) {
          output += `  • ${assessment} assessment\n`;
        }
      } else {
        output += `  • Continue with current assessment\n`;
      }
    }

    return output;
  }
}
