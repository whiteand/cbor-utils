import { err, type Result } from "resultra";
import { BaseError } from "./BaseError";
import { singleton } from "./singleton";

/**
 * Represents a situation when more data was expected
 * but the input ended before that.
 */
export class EndOfInputError extends BaseError {
  constructor() {
    super("End of input");
  }
}

/**
 * Returns end of input error ensuring that only one instance of error is created
 */
export const getEoiError: () => EndOfInputError = singleton(
  () => new EndOfInputError()
);

/**
 * Returns end of input error result ensuring that only one instance of result will be created
 */
export const getEoiResult: () => Result<never, EndOfInputError> = singleton(
  () => err(getEoiError())
);
