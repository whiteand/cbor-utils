import { Result } from "resultra";
import { IWriter } from "./types";

export interface IEncoder<
  WriterError = unknown,
  Writer extends IWriter<WriterError> = IWriter<WriterError>
> {
  getWriter(): Writer;
  bool(b: boolean): Result<this, WriterError>;
  put(bytes: Uint8Array): Result<this, WriterError>;
  u8(n: number): Result<this, WriterError>;
  u16(n: number): Result<this, WriterError>;
  u32(n: number): Result<this, WriterError>;
  u64(n: number | bigint): Result<this, WriterError>;
  i8(n: number): Result<this, WriterError>;
  i16(n: number): Result<this, WriterError>;
  i32(n: number): Result<this, WriterError>;
  i64(n: number | bigint): Result<this, WriterError>;
  int(n: number | bigint): Result<this, WriterError>;
  str(x: string): Result<this, WriterError>;
  bytes(bytes: Uint8Array): Result<this, WriterError>;
  array(len: number | bigint): Result<this, WriterError>;
  beginArray(): Result<this, WriterError>;
  beginBytes(): Result<this, WriterError>;
  beginMap(): Result<this, WriterError>;
  end(): Result<this, WriterError>;
  null(): Result<this, WriterError>;
  nullable<T, E>(
    item: (e: this, value: T) => Result<unknown, E>,
    value: T | null
  ): Result<this, WriterError | E>;
}
