import { Result, err } from "resultra";

export abstract class ResultError extends Error {
  constructor(message: string) {
    super(message);
  }
  err(): Result<never, this> {
    return err(this);
  }
}
