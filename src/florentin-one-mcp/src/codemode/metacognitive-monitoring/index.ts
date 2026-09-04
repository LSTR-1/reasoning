import { MetacognitiveAnalyzer } from "../../core/metacognitive-monitoring/analyzer.js";
import { MetacognitiveMonitoringData, MonitoringResult } from "../../core/metacognitive-monitoring/types.js";

/**
 * Metacognitive Monitoring API for Code Mode.
 *
 * This API allows direct programmatic access to the metacognitive monitoring capabilities,
 * enabling LLMs to write code that performs self-monitoring steps.
 */
export class MetacognitiveCodeMode {
  private analyzer: MetacognitiveAnalyzer;

  constructor() {
    this.analyzer = new MetacognitiveAnalyzer();
  }

  /**
   * Performs a metacognitive monitoring assessment.
   *
   * @param input - The monitoring data input. Must be a complete object satisfying the MetacognitiveMonitoringData interface.
   * @returns The monitoring result
   */
  public async monitor(input: MetacognitiveMonitoringData): Promise<MonitoringResult> {
    // Pass strictly typed input to the analyzer
    const { result } = this.analyzer.process(input);
    return result;
  }
}

/**
 * Default instance for quick usage.
 */
export const metacognitive = new MetacognitiveCodeMode();

// Re-export types for usage in code
export * from "../../core/metacognitive-monitoring/types.js";
