import { ok, Result } from "resultra";
import { IReader, ISliceReader, IWriter } from "../types";

export class Uint8ArrayReader implements IReader, ISliceReader, IWriter {
  private chunks: Uint8Array[];
  private chunkIndex: number;
  private chunkOffset: number;
  private totalLength: number;
  constructor(...chunks: Uint8Array[]) {
    this.chunks = chunks;
    this.chunkIndex = 0;
    this.chunkOffset = 0;
    this.totalLength = 0;
    for (let i = 0; i < chunks.length; i++) {
      this.totalLength += chunks[i].length;
    }
  }
  get byteLength(): number {
    return this.totalLength;
  }
  write(data: Uint8Array): Result<number> {
    this.chunks.push(data);
    this.totalLength += data.length;
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

  readSlice(from: number, to: number, target?: Uint8Array): Result<Uint8Array> {
    if (this.chunks.length <= 0) {
      return ok(target ? target.subarray(0, 0) : new Uint8Array(0));
    }
    this.collapseChunks();
    const chunk = this.chunks[0];
    const start = Math.max(0, from < 0 ? chunk.length + from : from);
    const end = Math.min(chunk.length, to > 0 ? to : chunk.length + to);
    if (start >= end) {
      return ok(target ? target.subarray(0, 0) : new Uint8Array(0));
    }
    const len = end - start;
    if (!target || target.length < len) {
      target = new Uint8Array(len);
    }
    target =
      target && target.length >= len
        ? target.subarray(0, len)
        : new Uint8Array(len);
    target.set(chunk.subarray(start, end));

    return ok(target);
  }
  private collapseChunks(): void {
    if (this.chunks.length <= 1) {
      return;
    }
    const result = new Uint8Array(this.totalLength);
    let offset = 0;
    let targetOffset = 0;
    for (let i = 0; i < this.chunks.length; i++) {
      result.set(this.chunks[i], offset);
      offset += this.chunks[i].length;
      if (i < this.chunkIndex) {
        targetOffset += this.chunks[i].length;
      } else if (i === this.chunkIndex) {
        targetOffset += this.chunkOffset;
      }
    }
    this.chunks = [result];
    this.chunkIndex = 0;
    this.chunkOffset = targetOffset;
  }
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
