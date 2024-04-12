import { Result } from "resultra";
import { AnyWriter, WriterError } from "./infer";

export interface IEncoder<Writer extends AnyWriter = AnyWriter> {
  _INFER_WRITER_ERROR: WriterError<Writer>;
  _INFER_WRITER: Writer;
  getWriter(): Writer;
  bool(b: boolean): Result<this, WriterError<Writer>>;
  put(bytes: Uint8Array): Result<this, WriterError<Writer>>;
  u8(n: number): Result<this, WriterError<Writer>>;
  u16(n: number): Result<this, WriterError<Writer>>;
  u32(n: number): Result<this, WriterError<Writer>>;
  u64(n: number | bigint): Result<this, WriterError<Writer>>;
  i8(n: number): Result<this, WriterError<Writer>>;
  i16(n: number): Result<this, WriterError<Writer>>;
  i32(n: number): Result<this, WriterError<Writer>>;
  i64(n: number | bigint): Result<this, WriterError<Writer>>;
  int(n: number | bigint): Result<this, WriterError<Writer>>;
  str(x: string): Result<this, WriterError<Writer>>;
  bytes(bytes: Uint8Array): Result<this, WriterError<Writer>>;
  array(len: number | bigint): Result<this, WriterError<Writer>>;
  beginArray(): Result<this, WriterError<Writer>>;
  beginBytes(): Result<this, WriterError<Writer>>;
  beginMap(): Result<this, WriterError<Writer>>;
  end(): Result<this, WriterError<Writer>>;
  null(): Result<this, WriterError<Writer>>;
  nullable<T, E>(
    item: (e: this, value: T) => Result<unknown, E>,
    value: T | null
  ): Result<this, WriterError<Writer> | E>;
}
