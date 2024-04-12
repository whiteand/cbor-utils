import { Result } from "resultra";
import { Type } from "./Type";
import { IReader } from "./types";
import { EndOfInputError, InvalidParams } from "./errors";
import { TypeMismatchError } from "./errors";

export interface IDecoder<R extends IReader<any> = IReader<unknown>> {
  _INFER_READER: R;
  _INFER_READER_ERROR: R["_INFER_ERROR"];
  position(): number;
  read(): Result<number, R["_INFER_ERROR"] | EndOfInputError>;
  peek(): Result<number, EndOfInputError | R["_INFER_ERROR"]>;
  current(): number | null;
  bool(): Result<
    boolean,
    EndOfInputError | R["_INFER_ERROR"] | TypeMismatchError
  >;
  getReader(): R;
  u8(): Result<number, EndOfInputError | R["_INFER_ERROR"] | TypeMismatchError>;
  u16(): Result<
    number,
    EndOfInputError | R["_INFER_ERROR"] | TypeMismatchError
  >;
  u32(): Result<
    number,
    EndOfInputError | R["_INFER_ERROR"] | TypeMismatchError
  >;
  u64(): Result<
    number | bigint,
    EndOfInputError | R["_INFER_ERROR"] | TypeMismatchError
  >;
  i8(): Result<number, EndOfInputError | R["_INFER_ERROR"] | TypeMismatchError>;
  i16(): Result<
    number,
    EndOfInputError | R["_INFER_ERROR"] | TypeMismatchError
  >;
  i32(): Result<
    number,
    EndOfInputError | R["_INFER_ERROR"] | TypeMismatchError
  >;
  int(): Result<
    number | bigint,
    EndOfInputError | R["_INFER_ERROR"] | TypeMismatchError
  >;
  i64(): Result<
    number | bigint,
    EndOfInputError | R["_INFER_ERROR"] | TypeMismatchError
  >;
  readSlice(
    size: number | bigint
  ): Result<Uint8Array, InvalidParams | R["_INFER_ERROR"] | EndOfInputError>;
  bytes(): Result<
    Uint8Array,
    EndOfInputError | R["_INFER_ERROR"] | TypeMismatchError
  >;
  array(): Result<
    bigint | number | null,
    R["_INFER_ERROR"] | EndOfInputError | TypeMismatchError
  >;
  arrayIter<T, E>(
    item: (d: this) => Result<T, E>
  ): Result<
    Iterator<Result<T, E | R["_INFER_ERROR"] | EndOfInputError>> &
      Iterable<Result<T, E | R["_INFER_ERROR"] | EndOfInputError>>,
    R["_INFER_ERROR"] | EndOfInputError | TypeMismatchError
  >;
  strIter(): Result<Iterator<Result<string>> & Iterable<Result<string>>>;
  str(): Result<
    string,
    EndOfInputError | R["_INFER_ERROR"] | TypeMismatchError
  >;
  bytesIter(
    item: (d: IDecoder<R>) => Result<Uint8Array>
  ): Result<Iterator<Result<Uint8Array>> & Iterable<Result<Uint8Array>>>;
  peekType(): Result<Type | null, R["_INFER_ERROR"] | EndOfInputError>;
  skip(): Result<this, EndOfInputError | R["_INFER_ERROR"]>;
  nullable<T, E>(
    item: (d: this) => Result<T, E>
  ): Result<T | null, E | R["_INFER_ERROR"] | EndOfInputError>;
}
