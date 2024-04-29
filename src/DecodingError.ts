import { EndOfInputError } from "./EndOfInputError";
import { InvalidCborError } from "./InvalidCborError";
import { TypeMismatchError } from "./TypeMismatchError";

export type DecodingError =
  | EndOfInputError
  | InvalidCborError
  | TypeMismatchError;
