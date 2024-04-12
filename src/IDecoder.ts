import { Result } from "resultra";
import { Type } from "./Type";
import { EndOfInputError, InvalidParams, TypeMismatchError } from "./errors";
import { AnyReader, ReaderError } from "./infer";
import { IReader } from "./types";

export interface IDecoder<R extends AnyReader = IReader<unknown>> {
  _INFER_READER: R;
  _INFER_READER_ERROR: ReaderError<R>;
  position(): number;
  read(): Result<number, ReaderError<R> | EndOfInputError>;
  peek(): Result<number, EndOfInputError | ReaderError<R>>;
  current(): number | null;
  bool(): Result<boolean, EndOfInputError | ReaderError<R> | TypeMismatchError>;
  getReader(): R;
  u8(): Result<number, EndOfInputError | ReaderError<R> | TypeMismatchError>;
  u16(): Result<number, EndOfInputError | ReaderError<R> | TypeMismatchError>;
  u32(): Result<number, EndOfInputError | ReaderError<R> | TypeMismatchError>;
  u64(): Result<
    number | bigint,
    EndOfInputError | ReaderError<R> | TypeMismatchError
  >;
  i8(): Result<number, EndOfInputError | ReaderError<R> | TypeMismatchError>;
  i16(): Result<number, EndOfInputError | ReaderError<R> | TypeMismatchError>;
  i32(): Result<number, EndOfInputError | ReaderError<R> | TypeMismatchError>;
  int(): Result<
    number | bigint,
    EndOfInputError | ReaderError<R> | TypeMismatchError
  >;
  i64(): Result<
    number | bigint,
    EndOfInputError | ReaderError<R> | TypeMismatchError
  >;
  readSlice(
    size: number | bigint
  ): Result<Uint8Array, InvalidParams | ReaderError<R> | EndOfInputError>;
  bytes(): Result<
    Uint8Array,
    EndOfInputError | ReaderError<R> | TypeMismatchError
  >;
  array(): Result<
    bigint | number | null,
    ReaderError<R> | EndOfInputError | TypeMismatchError
  >;
  arrayIter<T, E>(
    item: (d: this) => Result<T, E>
  ): Result<
    Iterator<Result<T, E | ReaderError<R> | EndOfInputError>> &
      Iterable<Result<T, E | ReaderError<R> | EndOfInputError>>,
    ReaderError<R> | EndOfInputError | TypeMismatchError
  >;
  strIter(): Result<Iterator<Result<string>> & Iterable<Result<string>>>;
  str(): Result<string, EndOfInputError | ReaderError<R> | TypeMismatchError>;
  bytesIter(
    item: (d: IDecoder<R>) => Result<Uint8Array>
  ): Result<Iterator<Result<Uint8Array>> & Iterable<Result<Uint8Array>>>;
  peekType(): Result<Type | null, ReaderError<R> | EndOfInputError>;
  skip(): Result<this, EndOfInputError | ReaderError<R>>;
  nullable<T, E>(
    item: (d: this) => Result<T, E>
  ): Result<T | null, E | ReaderError<R> | EndOfInputError>;
}
