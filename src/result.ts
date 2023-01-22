import { TResult } from "./types";

export function ok<T>(value: T): TResult<T> {
  return { ok: true, value };
}

export function err(value: Error): TResult<never> {
  return { ok: false, error: value };
}
