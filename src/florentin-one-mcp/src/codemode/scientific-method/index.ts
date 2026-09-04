import { ScientificMethodCore } from "../../core/scientific-method/ScientificMethod.js";
import { ScientificInquiryData } from "../../core/scientific-method/types.js";

/**
 * Code Mode API for the Scientific Method MCP server.
 *
 * This class provides a programmatic interface to the scientific method workflow,
 * allowing direct integration of scientific inquiry capabilities into applications.
 * It serves as a wrapper around the core business logic, exposing a clean, typed API.
 *
 * **Purpose**:
 * - Facilitates structured scientific inquiry (observation, hypothesis, experiment, analysis, conclusion).
 * - Enforces rigorous data validation for each stage of the scientific process.
 * - Provides visualization tools for scientific data.
 *
 * **Limitations**:
 * - **Stateless Operation**: The API operates in-memory. Data persistence is not handled
 *   internally and must be managed by the consumer if cross-session state is required.
 * - **No External Side Effects**: The API does not perform external actions (like running
 *   physical experiments); it records and analyzes provided data.
 *
 * **Operational Workflows**:
 *
 * 1. **Initialization**:
 *    ```typescript
 *    const scienceApi = new ScientificMethodCodeMode();
 *    ```
 *
 * 2. **Processing an Inquiry Step**:
 *    ```typescript
 *    const result = await scienceApi.processInquiry({
 *      stage: "hypothesis",
 *      inquiryId: "exp-001",
 *      hypothesis: { ... },
 *      // ... other fields
 *    });
 *    ```
 *
 * 3. **Retrieving History**:
 *    ```typescript
 *    const history = await scienceApi.getInquiryHistory("exp-001");
 *    ```
 *
 * 4. **Visualization**:
 *    ```typescript
 *    const visual = scienceApi.visualize(result);
 *    console.log(visual);
 *    ```
 */
export class ScientificMethodCodeMode {
  private core: ScientificMethodCore;

  constructor() {
    this.core = new ScientificMethodCore();
  }

  /**
   * Processes a scientific inquiry step.
   *
   * @param input - The input data for the inquiry step.
   * @returns The validated and processed scientific inquiry data.
   */
  public async processInquiry(input: unknown): Promise<ScientificInquiryData> {
    return this.core.processScientificInquiry(input);
  }

  /**
   * Retrieves the history of a specific scientific inquiry.
   *
   * @param inquiryId - The unique identifier of the inquiry.
   * @returns An array of scientific inquiry data representing the history of the inquiry.
   */
  public async getInquiryHistory(inquiryId: string): Promise<ScientificInquiryData[]> {
    return this.core.getInquiryHistory(inquiryId);
  }

  /**
   * Generates a text visualization of the scientific inquiry data.
   *
   * @param data - The scientific inquiry data to visualize.
   * @returns A formatted string representation of the data.
   */
  public visualize(data: ScientificInquiryData): string {
    return this.core.visualizeScientificInquiry(data);
  }
}

export * from "../../core/scientific-method/types.js";
