import { ok, Result } from "../result";
import { IReader, IWriter } from "../types";

export class Uint8ArrayReader implements IReader, IWriter {
  private chunks: Uint8Array[];
  private chunkIndex: number;
  private chunkOffset: number;
  constructor(...chunks: Uint8Array[]) {
    this.chunks = chunks;
    this.chunkIndex = 0;
    this.chunkOffset = 0;
  }
  write(data: Uint8Array): Result<number> {
    this.chunks.push(data);
    return ok(data.length);
  }
  private next = (): number | null => {
    if (this.chunkIndex >= this.chunks.length) {
      return null;
    }
    const chunk = this.chunks[this.chunkIndex];
    if (this.chunkOffset >= chunk.length) {
      this.chunkIndex++;
      this.chunkOffset = 0;
      return this.next();
    }
    const result = chunk[this.chunkOffset];
    this.chunkOffset++;
    return result;
  };
  read(data: Uint8Array): Result<number> {
    let i = 0;
    while (i < data.length) {
      const next = this.next();
      if (next === null) {
        return ok(i);
      }
      data[i] = next;
      i++;
    }
    return ok(i);
  }
  clear() {
    this.chunks = [];
    this.chunkIndex = 0;
    this.chunkOffset = 0;
  }
}
