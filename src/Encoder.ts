import { SIMPLE } from "./constants";
import { ok } from "./result";
import { IWriter, Result } from "./types";

export class Encoder<W extends IWriter> {
  constructor(private readonly writer: W) {}
  getWriter(): W {
    return this.writer;
  }
  private put(bytes: Uint8Array): Result<this> {
    let written = 0;
    while (written < bytes.length) {
      const writeResult = this.writer.write(bytes.subarray(written));
      if (!writeResult.ok) return writeResult;
      written += writeResult.value;
    }
    return ok(this);
  }
  bool(bool: boolean): Result<this> {
    return this.put(new Uint8Array([SIMPLE | (bool ? 0x15 : 0x14)]));
  }
}
