import { ApiError } from "@/Errors/ApiError";

export class AxiosError extends ApiError {
  constructor(message: string) {
    super(message);
    this.name = "AxiosError";
  }
}
