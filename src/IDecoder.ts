import { Result } from "resultra";
import { Type } from "./Type";
import { IReader } from "./types";
import { EndOfInputError, InvalidParams } from "./errors";
import { TypeMismatchError } from "./errors";

type RE<R extends IReader> = R extends {
  read(...args: any): Result<any, infer E>;
}
  ? E
  : Error;

export interface IDecoder<
  ReaderError,
  R extends IReader<ReaderError> = IReader<ReaderError>
> {
  position(): number;
  read(): Result<number, ReaderError | EndOfInputError>;
  peek(): Result<number, EndOfInputError | ReaderError>;
  current(): number | null;
  bool(): Result<boolean, EndOfInputError | ReaderError | TypeMismatchError>;
  getReader(): R;
  u8(): Result<number, EndOfInputError | ReaderError | TypeMismatchError>;
  u16(): Result<number, EndOfInputError | ReaderError | TypeMismatchError>;
  u32(): Result<number, EndOfInputError | ReaderError | TypeMismatchError>;
  u64(): Result<
    number | bigint,
    EndOfInputError | ReaderError | TypeMismatchError
  >;
  i8(): Result<number, EndOfInputError | ReaderError | TypeMismatchError>;
  i16(): Result<number, EndOfInputError | ReaderError | TypeMismatchError>;
  i32(): Result<number, EndOfInputError | ReaderError | TypeMismatchError>;
  int(): Result<
    number | bigint,
    EndOfInputError | ReaderError | TypeMismatchError
  >;
  i64(): Result<
    number | bigint,
    EndOfInputError | ReaderError | TypeMismatchError
  >;
  readSlice(
    size: number | bigint
  ): Result<Uint8Array, InvalidParams | ReaderError | EndOfInputError>;
  bytes(): Result<
    Uint8Array,
    EndOfInputError | ReaderError | TypeMismatchError
  >;
  array(): Result<
    bigint | number | null,
    ReaderError | EndOfInputError | TypeMismatchError
  >;
  arrayIter<T, E>(
    item: (d: this) => Result<T, E>
  ): Result<
    Iterator<Result<T, E>> & Iterable<Result<T, E>>,
    ReaderError | EndOfInputError | TypeMismatchError
  >;
  strIter(): Result<Iterator<Result<string>> & Iterable<Result<string>>>;
  str(): Result<string, EndOfInputError | ReaderError | TypeMismatchError>;
  bytesIter(
    item: (d: IDecoder<R>) => Result<Uint8Array>
  ): Result<Iterator<Result<Uint8Array>> & Iterable<Result<Uint8Array>>>;
  peekType(): Result<Type | null, ReaderError | EndOfInputError>;
  skip(): Result<this, EndOfInputError | ReaderError>;
  nullable<T, E>(
    item: (d: this) => Result<T, E>
  ): Result<T | null, E | ReaderError | EndOfInputError>;
}
