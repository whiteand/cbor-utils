import { EndOfInputError } from "./EndOfInputError";
import { InvalidCborError } from "./InvalidCborError";
import { TypeMismatchError } from "./TypeMismatchError";
import { NotImportant } from "./types";
import { UnexpectedValueError } from "./UnexpectedValueError";

/**
 * Returns a standard errors which can occur during decoding.
 */
export type DecodingError =
  | EndOfInputError
  | InvalidCborError
  | UnexpectedValueError<NotImportant, NotImportant>
  | TypeMismatchError;
