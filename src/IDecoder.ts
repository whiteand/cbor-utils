import { Result } from "resultra";
import { Type } from "./Type";
import { IReader } from "./types";

export interface IDecoder<R extends IReader = IReader> {
  position(): number;
  read(): Result<number>;
  peek(): Result<number>;
  current(): number | null;
  bool(): Result<boolean>;
  getReader(): R;
  u8(): Result<number>;
  u16(): Result<number>;
  u32(): Result<number>;
  u64(): Result<number | bigint>;
  i8(): Result<number>;
  i16(): Result<number>;
  i32(): Result<number>;
  int(): Result<number | bigint>;
  i64(): Result<number | bigint>;
  bytes(): Result<Uint8Array>;
  array(): Result<bigint | number | null>;
  arrayIter<T>(
    item: (d: IDecoder) => Result<T>
  ): Result<Iterator<Result<T>> & Iterable<Result<T>>>;
  strIter(): Result<Iterator<Result<string>> & Iterable<Result<string>>>;
  str(): Result<string>;
  bytesIter(
    item: (d: IDecoder) => Result<Uint8Array>
  ): Result<Iterator<Result<Uint8Array>> & Iterable<Result<Uint8Array>>>;
  peekType(): Result<Type | null>;
  skip(): Result<this>;
  nullable<T>(item: (d: IDecoder) => Result<T>): Result<T | null>;
}
