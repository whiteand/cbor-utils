import { BaseError } from "./BaseError";
import { singleton } from "./singleton";

export class EndOfInputError extends BaseError {
  constructor() {
    super("End of input");
  }
}

export const getEoiError = singleton(() => new EndOfInputError());
export const getEoiResult = singleton(() => getEoiError().err());
