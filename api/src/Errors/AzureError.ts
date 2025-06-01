import { ApiError } from "@/Errors/ApiError";

export class AzureError extends ApiError {
  constructor(message: string = "An error occurred with Azure") {
    super(message);
    this.name = "AzureError";
  }
}