import { JSDOM } from "jsdom";
import { InvalidHtml } from "@/Errors/InvalidHtml";

export class ExtractTextAndTitleFromHTML {
  /**
   * Function to extract textual content and the title from an HTML page, dividing the text into smaller parts,
   * with a maximum number of characters specified (1000 characters by default).
   *
   * @param html - HTML to process.
   * @param maxLength - Maximum number of characters allowed in each part of the text.
   * @returns string[] - Array of strings, where each string represents a part of the extracted text.
   *
   * @throws InvalidHtml if the HTML title or body content is missing.
   */
  public execute(
    html: string,
    maxLength: number = 1000,
  ): string[] {
    const dom = new JSDOM(html);

    const bodyText = dom.window.document.body?.textContent || "";
    const titleText = dom.window.document.title || "";

    if (!bodyText || !titleText) {
      throw new InvalidHtml();
    }

    const textPage = `title=${titleText} ; body=${bodyText}`;

    const cleanedText = textPage.replace(/\s+/g, " ").trim();

    const textChunks: string[] = [];

    for (let i = 0; i < cleanedText.length; i += maxLength) {
      textChunks.push(cleanedText.substring(i, i + maxLength));
    }

    return textChunks;
  }
}
