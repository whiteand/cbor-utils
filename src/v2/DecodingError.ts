import { EndOfInputError } from "./EndOfInputError";
import { InvalidCborError } from "./InvalidCborError";
import { TypeMismatchError } from "./TypeMismatchError";
import { UnexpectedValueError } from "./UnexpectedValueError";

export type DecodingError =
  | EndOfInputError
  | InvalidCborError
  | UnexpectedValueError<any, any>
  | TypeMismatchError;
