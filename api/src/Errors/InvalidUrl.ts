import { ApiError } from "@/Errors/ApiError";

export class InvalidUrl extends ApiError {
  constructor() {
    super("The provided URL is invalid.");
    this.name = "InvalidUrl";
  }
}