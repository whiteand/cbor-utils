import { EndOfInputError } from "./EndOfInputError";
import { err, ok } from "./result";
import { Type } from "./Type";
import { TypeMismatchError } from "./TypeMismatchError";
import { typeOf } from "./typeOf";
import { IReader, Result } from "./types";
import { typeToStr } from "./typeToStr";

type u8 = number;

export type TypeResult =
  | { known: true; type: Type }
  | { known: false; type: number };

export function typeResultToStr(result: TypeResult): string {
  return result.known ? typeToStr(result.type) : `unknown type ${result.type}`;
}

export class Decoder<R extends IReader> {
  private reader: R;
  private buffer: Uint8Array;
  private bufSize: number;
  private pos: number;
  private globalPos: number;
  constructor(reader: R, { bufferSize }: { bufferSize?: number } = {}) {
    this.reader = reader;
    this.buffer = new Uint8Array(bufferSize || 1024);
    this.pos = 0;
    this.bufSize = 0;
    this.globalPos = 0;
  }

  private loadNextChunk(): Result<number> {
    const result = this.reader.read(this.buffer);
    if (!result.ok) return result;
    if (result.value <= 0) {
      return { ok: false, error: new EndOfInputError() };
    }
    this.bufSize = result.value;
    this.pos = 0;
    return ok(result.value);
  }

  private read(): Result<u8> {
    if (this.pos >= this.bufSize) {
      const res = this.loadNextChunk();
      if (!res.ok) return res;
    }
    const p = this.pos;
    const b = this.buffer[p];

    this.globalPos += 1;
    this.pos += 1;

    return ok(b);
  }
  private peek(): Result<u8> {
    if (this.pos >= this.bufSize) {
      const res = this.loadNextChunk();
      if (!res.ok) return res;
    }
    return ok(this.buffer[this.pos]);
  }

  bool(): Result<boolean> {
    const p = this.globalPos;
    const result = this.read();
    if (!result.ok) return result;
    const b = result.value;
    switch (b) {
      case 0xf4:
        return ok(false);
      case 0xf5:
        return ok(true);
    }
    const typeRes = this.typeOfOrUnknown(b);
    return err(new TypeMismatchError(typeRes, p, "expected bool"));
  }

  private typeOfOrUnknown(b: u8): TypeResult {
    const r = typeOf(b);
    if (!r.ok || r.value == null) return { known: false, type: b };
    return { known: true, type: r.value };
  }

  getReader(): R {
    return this.reader;
  }
}
