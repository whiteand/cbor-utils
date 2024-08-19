import { ErrResult, err } from "resultra";

export class BaseError extends Error {
  constructor(message: string) {
    super(message);
  }
  err(): ErrResult<this> {
    return err(this);
  }
}
