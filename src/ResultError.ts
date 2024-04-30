import { Result, err } from "resultra";

export abstract class ResultError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
  err(): Result<never, this> {
    return err(this);
  }
}
