import { Result } from "resultra";

export interface IWriter<E = Error> {
  write(data: Uint8Array): Result<number, E>;
}

export interface IReader<E = Error> {
  read(data: Uint8Array): Result<number, E>;
}

export interface ISliceReader<E = Error> {
  readSlice(
    from: number,
    to: number,
    target?: Uint8Array
  ): Result<Uint8Array, E>;
}

export interface IReadAll {
  readAll(): Result<Uint8Array>;
}

export type u8 = number;
