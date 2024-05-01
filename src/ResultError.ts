import { ErrResult, Result, err } from "resultra";

export abstract class ResultError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
  err(): ErrResult<this> {
    return err(this);
  }
}
