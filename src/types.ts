import { Result } from "./result";

export interface IWriter {
  write(data: Uint8Array): Result<number>;
}

export interface IReader {
  read(data: Uint8Array): Result<number>;
}

export type u8 = number;
