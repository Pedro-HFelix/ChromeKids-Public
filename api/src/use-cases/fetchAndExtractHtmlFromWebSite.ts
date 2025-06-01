import axios from "axios";
import { JSDOM } from "jsdom";
import { InvalidUrl } from "@/Errors/InvalidUrl";
import { AxiosError } from "@/Errors/AxiosError";

/**
 * Class to make an HTTP request to a URL and extract the complete HTML of the page.
 *
 * @param url - URL of the web page from which the HTML will be extracted.
 * @returns string - String containing the complete HTML of the page.
 *
 * @throws InvalidUrl if the provided URL is not valid.
 * @throws AxiosError if an error occurs during the HTTP request (e.g., server error, no response).
 * @throws Error for other unexpected errors during processing.
 */
export class FetchAndExtractHtmlFromWebSite {

  public async execute(url: string): Promise<string> {
    if (!/^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/.test(url)) {
      throw new InvalidUrl();
    }

    try {
      const response = await axios.get(url, { timeout: 10000 });

      const dom = new JSDOM(response.data);

      return dom.window.document.documentElement.outerHTML;
    } catch (error: any) {
      if (error.isAxiosError) {
        if (error.response) {
          throw new AxiosError(`Error accessing the URL: ${url}. Status: ${error.response.status}`);
        } else if (error.request) {
          throw new AxiosError(`Error making the request to the URL: ${url}. No response from server.`);
        } else {
          throw new AxiosError(error.message || `An unexpected Axios error occurred while requesting ${url}.`);
        }
      } else {
        throw new Error(error.message || `An unexpected error occurred while processing the URL: ${url}.`);
      }
    }
  }
}