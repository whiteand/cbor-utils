import { Result } from "resultra";

export interface IWriter {
  write(data: Uint8Array): Result<number>;
}

export interface IReader {
  read(data: Uint8Array): Result<number>;
}

export interface ISliceReader {
  readSlice(from: number, to: number, target?: Uint8Array): Result<Uint8Array>;
}

export interface IReadAll {
  readAll(): Result<Uint8Array>;
}

export type u8 = number;
