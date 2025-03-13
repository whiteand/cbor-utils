import { err, type Result } from "resultra";
import { BaseError } from "./BaseError";
import { singleton } from "./singleton";

export class EndOfInputError extends BaseError {
  constructor() {
    super("End of input");
  }
}

export const getEoiError: () => EndOfInputError = singleton(
  () => new EndOfInputError()
);
export const getEoiResult: () => Result<never, EndOfInputError> = singleton(
  () => err(getEoiError())
);
