import { ApiError } from "@/Errors/ApiError";

export class InvalidHtml extends ApiError {
  constructor() {
    super("The provided HTML is invalid.");
    this.name = "InvalidHtml";
  }
}