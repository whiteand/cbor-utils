import { ErrResult, err } from "resultra";

export class BaseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
  err(): ErrResult<this> {
    return err(this);
  }
}
