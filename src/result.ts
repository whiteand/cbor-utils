import { Result } from "./types";

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err(value: Error): Result<never> {
  return { ok: false, error: value };
}
