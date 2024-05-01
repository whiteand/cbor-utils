import { EndOfInputError } from "./EndOfInputError";
import { InvalidCborError } from "./InvalidCborError";
import { TypeMismatchError } from "./TypeMismatchError";
import { UnexpectedValue } from "./UnexpectedValue";

export type DecodingError =
  | EndOfInputError
  | InvalidCborError
  | UnexpectedValue<any, any>
  | TypeMismatchError;
