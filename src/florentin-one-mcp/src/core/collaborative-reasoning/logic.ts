import chalk from "chalk";
import { CollaborativeReasoningData, Contribution, Disagreement, Persona } from "./types.js";

export class CollaborativeReasoningManager {
  private personaRegistry: Record<string, Record<string, Persona>> = {};
  private contributionHistory: Record<string, Contribution[]> = {};
  private disagreementTracker: Record<string, Disagreement[]> = {};
  private sessionHistory: Record<string, CollaborativeReasoningData[]> = {};

  public validateCollaborativeReasoningData(input: unknown): CollaborativeReasoningData {
    const data = input as Record<string, unknown>;

    // Validate required fields
    if (!data.topic || typeof data.topic !== "string") {
      throw new Error("Invalid topic: must be a string");
    }

    if (!Array.isArray(data.personas)) {
      throw new Error("Invalid personas: must be an array");
    }

    if (!Array.isArray(data.contributions)) {
      throw new Error("Invalid contributions: must be an array");
    }

    if (!data.stage || typeof data.stage !== "string") {
      throw new Error("Invalid stage: must be a string");
    }

    if (!data.activePersonaId || typeof data.activePersonaId !== "string") {
      throw new Error("Invalid activePersonaId: must be a string");
    }

    if (!data.sessionId || typeof data.sessionId !== "string") {
      throw new Error("Invalid sessionId: must be a string");
    }

    if (typeof data.iteration !== "number" || data.iteration < 0) {
      throw new Error("Invalid iteration: must be a non-negative number");
    }

    if (typeof data.nextContributionNeeded !== "boolean") {
      throw new Error("Invalid nextContributionNeeded: must be a boolean");
    }

    // Validate personas
    const personas: Persona[] = [];
    for (const persona of data.personas as Array<Record<string, unknown>>) {
      if (!persona.id || typeof persona.id !== "string") {
        throw new Error("Invalid persona id: must be a string");
      }

      if (!persona.name || typeof persona.name !== "string") {
        throw new Error("Invalid persona name: must be a string");
      }

      if (!Array.isArray(persona.expertise)) {
        throw new Error("Invalid persona expertise: must be an array");
      }

      if (!persona.background || typeof persona.background !== "string") {
        throw new Error("Invalid persona background: must be a string");
      }

      if (!persona.perspective || typeof persona.perspective !== "string") {
        throw new Error("Invalid persona perspective: must be a string");
      }

      if (!Array.isArray(persona.biases)) {
        throw new Error("Invalid persona biases: must be an array");
      }

      if (!persona.communication || typeof persona.communication !== "object") {
        throw new Error("Invalid persona communication: must be an object");
      }

      const communication = persona.communication as Record<string, unknown>;

      if (!communication.style || typeof communication.style !== "string") {
        throw new Error("Invalid persona communication style: must be a string");
      }

      if (!communication.tone || typeof communication.tone !== "string") {
        throw new Error("Invalid persona communication tone: must be a string");
      }

      const expertise: string[] = [];
      for (const exp of persona.expertise) {
        if (typeof exp === "string") {
          expertise.push(exp);
        }
      }

      const biases: string[] = [];
      for (const bias of persona.biases) {
        if (typeof bias === "string") {
          biases.push(bias);
        }
      }

      personas.push({
        id: persona.id as string,
        name: persona.name as string,
        expertise,
        background: persona.background as string,
        perspective: persona.perspective as string,
        biases,
        communication: {
          style: communication.style as string,
          tone: communication.tone as string
        }
      });
    }

    // Validate contributions
    const contributions: Contribution[] = [];
    for (const contribution of data.contributions as Array<Record<string, unknown>>) {
      if (!contribution.personaId || typeof contribution.personaId !== "string") {
        throw new Error("Invalid contribution personaId: must be a string");
      }

      if (!contribution.content || typeof contribution.content !== "string") {
        throw new Error("Invalid contribution content: must be a string");
      }

      if (!contribution.type || typeof contribution.type !== "string") {
        throw new Error("Invalid contribution type: must be a string");
      }

      if (typeof contribution.confidence !== "number" || contribution.confidence < 0 || contribution.confidence > 1) {
        throw new Error("Invalid contribution confidence: must be a number between 0 and 1");
      }

      const referenceIds: string[] = [];
      if (Array.isArray(contribution.referenceIds)) {
        for (const refId of contribution.referenceIds) {
          if (typeof refId === "string") {
            referenceIds.push(refId);
          }
        }
      }

      const contributionData: Contribution = {
        personaId: contribution.personaId as string,
        content: contribution.content as string,
        type: contribution.type as Contribution["type"],
        confidence: contribution.confidence as number
      };
      if (referenceIds.length > 0) {
        contributionData.referenceIds = referenceIds;
      }
      contributions.push(contributionData);
    }

    // Validate disagreements
    const disagreements: Disagreement[] = [];
    if (Array.isArray(data.disagreements)) {
      for (const disagreement of data.disagreements as Array<Record<string, unknown>>) {
        if (!disagreement.topic || typeof disagreement.topic !== "string") {
          throw new Error("Invalid disagreement topic: must be a string");
        }

        if (!Array.isArray(disagreement.positions)) {
          throw new Error("Invalid disagreement positions: must be an array");
        }

        const positions: Disagreement["positions"] = [];
        for (const position of disagreement.positions as Array<Record<string, unknown>>) {
          if (!position.personaId || typeof position.personaId !== "string") {
            throw new Error("Invalid position personaId: must be a string");
          }

          if (!position.position || typeof position.position !== "string") {
            throw new Error("Invalid position statement: must be a string");
          }

          if (!Array.isArray(position.arguments)) {
            throw new Error("Invalid position arguments: must be an array");
          }

          const args: string[] = [];
          for (const arg of position.arguments) {
            if (typeof arg === "string") {
              args.push(arg);
            }
          }

          positions.push({
            personaId: position.personaId as string,
            position: position.position as string,
            arguments: args
          });
        }

        let resolution: Disagreement["resolution"] | undefined = undefined;
        // Explicit, detailed type guard for disagreement.resolution
        if (
          disagreement.resolution &&
          typeof disagreement.resolution === "object" &&
          "type" in disagreement.resolution &&
          typeof disagreement.resolution.type === "string" &&
          ["consensus", "compromise", "integration", "tabled"].includes(disagreement.resolution.type) &&
          "description" in disagreement.resolution &&
          typeof disagreement.resolution.description === "string"
        ) {
          // Now TS knows the exact shape, inner checks are redundant
          resolution = {
            type: disagreement.resolution!.type as NonNullable<Disagreement["resolution"]>["type"],
            description: disagreement.resolution!.description
          };
        }

        const disagreementData: Disagreement = {
          topic: disagreement.topic as string,
          positions
        };
        if (resolution) {
          disagreementData.resolution = resolution;
        }
        disagreements.push(disagreementData);
      }
    }

    // Validate optional array fields
    const keyInsights: string[] = [];
    if (Array.isArray(data.keyInsights)) {
      for (const insight of data.keyInsights) {
        if (typeof insight === "string") {
          keyInsights.push(insight);
        }
      }
    }

    const consensusPoints: string[] = [];
    if (Array.isArray(data.consensusPoints)) {
      for (const point of data.consensusPoints) {
        if (typeof point === "string") {
          consensusPoints.push(point);
        }
      }
    }

    const openQuestions: string[] = [];
    if (Array.isArray(data.openQuestions)) {
      for (const question of data.openQuestions) {
        if (typeof question === "string") {
          openQuestions.push(question);
        }
      }
    }

    const suggestedContributionTypes: string[] = [];
    if (Array.isArray(data.suggestedContributionTypes)) {
      for (const type of data.suggestedContributionTypes) {
        if (typeof type === "string") {
          suggestedContributionTypes.push(type);
        }
      }
    }

    // Create validated data object
    const validatedData: CollaborativeReasoningData = {
      topic: data.topic as string,
      personas,
      contributions,
      stage: data.stage as CollaborativeReasoningData["stage"],
      activePersonaId: data.activePersonaId as string,
      sessionId: data.sessionId as string,
      iteration: data.iteration as number,
      nextContributionNeeded: data.nextContributionNeeded as boolean
    };

    // Conditionally add optional properties
    if (disagreements.length > 0) {
      validatedData.disagreements = disagreements;
    }
    if (typeof data.nextPersonaId === "string") {
      validatedData.nextPersonaId = data.nextPersonaId;
    }
    if (keyInsights.length > 0) {
      validatedData.keyInsights = keyInsights;
    }
    if (consensusPoints.length > 0) {
      validatedData.consensusPoints = consensusPoints;
    }
    if (openQuestions.length > 0) {
      validatedData.openQuestions = openQuestions;
    }
    if (data.finalRecommendation && typeof data.finalRecommendation === "string") {
      validatedData.finalRecommendation = data.finalRecommendation;
    }
    if (suggestedContributionTypes.length > 0) {
      validatedData.suggestedContributionTypes = suggestedContributionTypes;
    }

    return validatedData;
  }

  public updateRegistries(data: CollaborativeReasoningData): void {
    const sessionId = data.sessionId;

    // Update persona registry
    if (!this.personaRegistry[sessionId]) {
      this.personaRegistry[sessionId] = {};
    }

    for (const persona of data.personas) {
      this.personaRegistry[sessionId][persona.id] = persona;
    }

    // Update contribution history
    if (!this.contributionHistory[sessionId]) {
      this.contributionHistory[sessionId] = [];
    }

    for (const contribution of data.contributions) {
      // Only add new contributions
      const exists = this.contributionHistory[sessionId].some(
        (c) => c.personaId === contribution.personaId && c.content === contribution.content
      );

      if (!exists) {
        this.contributionHistory[sessionId].push(contribution);
      }
    }

    // Update disagreement tracker
    if (data.disagreements && data.disagreements.length > 0) {
      if (!this.disagreementTracker[sessionId]) {
        this.disagreementTracker[sessionId] = [];
      }

      for (const disagreement of data.disagreements) {
        // Check if this disagreement already exists
        const existingIndex = this.disagreementTracker[sessionId].findIndex((d) => d.topic === disagreement.topic);

        if (existingIndex >= 0) {
          // Update existing disagreement
          this.disagreementTracker[sessionId][existingIndex] = disagreement;
        } else {
          // Add new disagreement
          this.disagreementTracker[sessionId].push(disagreement);
        }
      }
    }
  }

  public updateSessionHistory(data: CollaborativeReasoningData): void {
    let historyEntry = this.sessionHistory[data.sessionId]; // Get potential entry
    if (!historyEntry) {
      // Check if it exists
      historyEntry = []; // Create new array if not
      this.sessionHistory[data.sessionId] = historyEntry; // Assign it back to the object
    }
    // Now, historyEntry is guaranteed to be CollaborativeReasoningData[]
    historyEntry.push(data);

    this.updateRegistries(data);
  }

  public selectNextPersona(data: CollaborativeReasoningData): string {
    // If nextPersonaId is already set, use it
    if (data.nextPersonaId) {
      return data.nextPersonaId;
    }

    // Otherwise, select the next persona in rotation
    if (!data.personas || data.personas.length === 0) {
      throw new Error("Cannot determine next persona: No personas defined in session.");
    }

    const personaIds = data.personas.map((p) => p.id);
    const currentIndex = personaIds.indexOf(data.activePersonaId);
    // If active persona not found (shouldn't happen ideally), default to first
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % personaIds.length;

    // personaIds[nextIndex] is guaranteed to be string due to empty check above
    return personaIds[nextIndex]!;
  }

  private getPersonaColor(index: number): (text: string) => string {
    const colors = [chalk.blue, chalk.green, chalk.yellow, chalk.magenta, chalk.cyan, chalk.red];

    // Use non-null assertion as logic guarantees a valid index
    return colors[index % colors.length]!;
  }

  private getContributionTypeColor(type: string): (text: string) => string {
    switch (type) {
      case "observation":
        return chalk.blue;
      case "question":
        return chalk.cyan;
      case "insight":
        return chalk.green;
      case "concern":
        return chalk.yellow;
      case "suggestion":
        return chalk.magenta;
      case "challenge":
        return chalk.red;
      case "synthesis":
        return chalk.white;
      default:
        return chalk.white;
    }
  }

  private getConfidenceBar(confidence: number): string {
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

  public visualizeCollaborativeReasoning(data: CollaborativeReasoningData): string {
    let output = `\n${chalk.bold(`COLLABORATIVE REASONING: ${data.topic}`)} (ID: ${data.sessionId})\n\n`;

    // Stage and iteration
    output += `${chalk.cyan("Stage:")} ${data.stage}\n`;
    output += `${chalk.cyan("Iteration:")} ${data.iteration}\n\n`;

    // Personas
    output += `${chalk.bold("PERSONAS:")}\n`;
    for (let i = 0; i < data.personas.length; i++) {
      const persona = data.personas[i];
      const color = this.getPersonaColor(i);

      output += `${color(`${persona?.name} (${persona?.id})`)}\n`;
      output += `  Expertise: ${persona?.expertise.join(", ")}\n`;
      output += `  Perspective: ${persona?.perspective}\n`;
      output += `  Communication: ${persona?.communication.style} (${persona?.communication.tone})\n`;

      // Highlight active persona
      if (persona?.id === data.activePersonaId) {
        output += `  ${chalk.bgGreen(chalk.black(" ACTIVE "))}\n`;
      }

      output += "\n";
    }

    // Contributions
    if (data.contributions.length > 0) {
      output += `${chalk.bold("CONTRIBUTIONS:")}\n\n`;

      for (const contribution of data.contributions) {
        // Find persona
        const persona = data.personas.find((p) => p.id === contribution.personaId);
        if (!persona) continue;

        // Get persona color
        const personaIndex = data.personas.findIndex((p) => p.id === contribution.personaId);
        const personaColor = this.getPersonaColor(personaIndex);

        // Get contribution type color
        const typeColor = this.getContributionTypeColor(contribution.type);

        output += `${personaColor(`[${persona.name}]`)} ${typeColor(`[${contribution.type}]`)}\n`;
        output += `${contribution.content}\n`;
        output += `Confidence: ${this.getConfidenceBar(contribution.confidence)}\n`;

        if (contribution.referenceIds && contribution.referenceIds.length > 0) {
          output += `References: ${contribution.referenceIds.join(", ")}\n`;
        }

        output += "\n";
      }
    }

    // Disagreements
    if (data.disagreements && data.disagreements.length > 0) {
      output += `${chalk.bold("DISAGREEMENTS:")}\n\n`;

      for (const disagreement of data.disagreements) {
        output += `${chalk.red("Topic:")} ${disagreement.topic}\n\n`;

        for (const position of disagreement.positions) {
          // Find persona
          const persona = data.personas.find((p) => p.id === position.personaId);
          if (!persona) continue;

          // Get persona color
          const personaIndex = data.personas.findIndex((p) => p.id === position.personaId);
          const personaColor = this.getPersonaColor(personaIndex);

          output += `${personaColor(`[${persona.name}]`)} Position: ${position.position}\n`;
          output += `  Arguments:\n`;
          for (const argument of position.arguments) {
            output += `  - ${argument}\n`;
          }
          output += "\n";
        }

        if (disagreement.resolution) {
          output += `${chalk.green("Resolution:")} ${disagreement.resolution.type}\n`;
          output += `${disagreement.resolution.description}\n\n`;
        } else {
          output += `${chalk.yellow("Status:")} Unresolved\n\n`;
        }
      }
    }

    // Collaboration output
    if (data.keyInsights && data.keyInsights.length > 0) {
      output += `${chalk.bold("KEY INSIGHTS:")}\n`;
      for (const insight of data.keyInsights) {
        output += `  - ${insight}\n`;
      }
      output += "\n";
    }

    if (data.consensusPoints && data.consensusPoints.length > 0) {
      output += `${chalk.bold("CONSENSUS POINTS:")}\n`;
      for (const point of data.consensusPoints) {
        output += `  - ${point}\n`;
      }
      output += "\n";
    }

    if (data.openQuestions && data.openQuestions.length > 0) {
      output += `${chalk.bold("OPEN QUESTIONS:")}\n`;
      for (const question of data.openQuestions) {
        output += `  - ${question}\n`;
      }
      output += "\n";
    }

    if (data.finalRecommendation) {
      output += `${chalk.bold("FINAL RECOMMENDATION:")}\n`;
      output += `${data.finalRecommendation}\n\n`;
    }

    // Next steps
    if (data.nextContributionNeeded) {
      const nextPersonaId = this.selectNextPersona(data);
      const nextPersona = data.personas.find((p) => p.id === nextPersonaId);

      if (nextPersona) {
        output += `${chalk.blue("NEXT CONTRIBUTION:")}\n`;
        output += `  Next persona: ${nextPersona.name}\n`;

        if (data.suggestedContributionTypes && data.suggestedContributionTypes.length > 0) {
          output += `  Suggested contribution types: ${data.suggestedContributionTypes.join(", ")}\n`;
        }
      }
    }

    return output;
  }
}
