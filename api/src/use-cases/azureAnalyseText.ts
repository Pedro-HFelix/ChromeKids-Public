import { AzureKeyCredential } from "@azure/core-auth";
import ContentSafetyClient, { isUnexpected } from "@azure-rest/ai-content-safety";
import { AzureError } from "@/Errors/AzureError";
import "dotenv/config"
export interface Category {
  category: string;
  severity: number;
}

export interface AzureAnalyseTextResponse {
  text: string;
  categoriesAnalysis: Category[];
  isReproved: boolean;
}

export interface ResponseAzureAnalyseTextResponse {
  isReproved: boolean;
  data: AzureAnalyseTextResponse[];
}

export class AzureAnalyseText {
  /**
     * Executes content safety analysis on a list of texts using the Azure Content Safety API.
     *
     * @param text - An array of strings containing the texts to be analyzed.
     * @returns An object containing:
     * - `isReproved`: A boolean indicating if any of the texts were reproved.
     * - `data`: An array with the analysis results for each text, including the list of analyzed categories, their severities, and if the text was reproved.
     *
     * @throws Error if there are problems with the API configuration or if the API call fails.
     * @throws AzureError if the API returns an unexpected result.
     */
  public async execute(text: string[]): Promise<ResponseAzureAnalyseTextResponse> {
    const apiKey = process.env.API_AZURE_IA_KEY || "";
    const endpoint = process.env.API_AZURE_IA_ENDPOINT || "";

    if (!apiKey || !endpoint) {
      throw new Error("API credentials or endpoint are not configured.");
    }

    const credential = new AzureKeyCredential(apiKey);
    const client = ContentSafetyClient(endpoint, credential);

    const azureAnalyseTextResponse = await Promise.all(
      text.map(async (t) => {
        const request = {
          body: {
            text: t,
            outputType: "EightSeverityLevels" as const,
          },
        };

        const result = await client.path("/text:analyze").post(request);

        if (isUnexpected(result)) {
          throw new AzureError(`Unexpected API response for text: "${t}". Status code: ${result.status}`);
        }

        const categories: Category[] = result.body.categoriesAnalysis.map(
          (category: any) => ({
            category: category.category,
            severity: category.severity,
          }),
        );
        return {
          text: t,
          categoriesAnalysis: categories,
          isReproved: this.isReproved(categories),
        };

      }),
    );

    console.log(azureAnalyseTextResponse)


    const reproved = azureAnalyseTextResponse.some((obj) => obj.isReproved);

    return {
      isReproved: reproved,
      data: azureAnalyseTextResponse,
    };
  }

  /**
   * Determines if the analyzed text should be reproved, based on the provided categories and severity levels.
   *
   * The reproval logic is as follows:
   * - **Sexual**: Reproved if severity is greater than or equal to 1.
   * - **Hate, SelfHarm, Violence**: Reproved if severity is greater than or equal to 2.
   * - Other categories do not cause reproval.
   *
   * @param categories - An array of objects representing the analyzed categories and their severities.
   * @returns `true` if the text is reproved, or `false` otherwise.
   */
  private isReproved(categories: Category[]): boolean {
    return categories.some((category) => {
      switch (category.category) {
        case "Sexual":
          return category.severity >= 1;
        case "Hate":
        case "SelfHarm":
        case "Violence":
          return category.severity >= 2;
        default:
          return false;
      }
    });
  }
}

