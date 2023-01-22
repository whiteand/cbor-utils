export type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

export interface IWriter {
  write(data: Uint8Array): Result<number>;
}

export interface IReader {
  read(data: Uint8Array): Result<number>;
}

export type u8 = number;
