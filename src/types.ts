export type TResult<T> = { ok: true; value: T } | { ok: false; error: Error };

export interface IWriter {
  write(data: Uint8Array): TResult<number>;
}

export interface IReader {
  read(data: Uint8Array): TResult<number>;
}

export type u8 = number;
