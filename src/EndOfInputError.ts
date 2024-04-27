import { Result, err } from "resultra";

export class EndOfInputError extends Error {
  constructor() {
    super("End of input");
  }
}

export const EOF = new EndOfInputError();
export const EOF_ERR = Object.freeze(err(EOF)) as Result<
  never,
  EndOfInputError
>;
