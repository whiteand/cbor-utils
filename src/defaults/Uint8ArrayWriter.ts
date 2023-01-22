import { IWriter, Result } from "../types";

export class Uint8ArrayWriter implements IWriter {
  writes: Uint8Array[];
  constructor() {
    this.writes = [];
  }
  write = (data: Uint8Array): Result<number> => {
    this.writes.push(data);
    return { ok: true, value: data.length };
  };
  intoUint8Array = () => {
    const length = this.writes.reduce((acc, write) => acc + write.length, 0);
    const result = new Uint8Array(length);
    let offset = 0;
    for (const write of this.writes) {
      result.set(write, offset);
      offset += write.length;
    }
    this.writes = [result];
    return result;
  };
  clear(): void {
    this.writes = [];
  }
}
