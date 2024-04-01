import { Result } from "resultra";
import { IWriter } from "./types";

export interface IEncoder {
  getWriter(): IWriter;
  bool(b: boolean): Result<this>;
  put(bytes: Uint8Array): Result<this>;
  u8(n: number): Result<this>;
  u16(n: number): Result<this>;
  u32(n: number): Result<this>;
  u64(n: number | bigint): Result<this>;
  i8(n: number): Result<this>;
  i16(n: number): Result<this>;
  i32(n: number): Result<this>;
  i64(n: number | bigint): Result<this>;
  int(n: number | bigint): Result<this>;
  str(x: string): Result<this>;
  bytes(bytes: Uint8Array): Result<this>;
  array(len: number | bigint): Result<this>;
  beginArray(): Result<this>;
  beginBytes(): Result<this>;
  beginMap(): Result<this>;
  end(): Result<this>;
  null(): Result<this>;
  nullable<T>(
    item: (e: IEncoder, value: T) => Result<unknown>,
    value: T | null
  ): Result<this>;
}
