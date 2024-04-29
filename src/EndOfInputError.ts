import { ResultError } from "./ResultError";

export class EndOfInputError extends ResultError {
  constructor() {
    super("End of input");
  }
}

export const EOI = new EndOfInputError();
export const EOI_ERR = EOI.err();
