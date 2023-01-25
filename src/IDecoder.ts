import { Result } from "resultra";
import { IReader } from "./types";

export interface IDecoder {
  position(): number;
  read(): Result<number>;
  peek(): Result<number>;
  current(): number | null;
  bool(): Result<boolean>;
  getReader(): IReader;
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
}
