import { EndOfInputError } from "./EndOfInputError";
import { InvalidCborError } from "./InvalidCborError";
import { TypeMismatchError } from "./TypeMismatchError";
import { NotImportant } from "./types";
import { UnexpectedValueError } from "./UnexpectedValueError";

export type DecodingError =
  | EndOfInputError
  | InvalidCborError
  | UnexpectedValueError<NotImportant, NotImportant>
  | TypeMismatchError;
