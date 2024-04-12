import { err, ok, Result } from "resultra";
import { BufferOverflowError } from "../errors";
import { IWriter } from "../types";

function getNewCapacity(oldCapacity: number): number {
  return Math.max(1, Math.ceil((oldCapacity * 3) / 2));
}

const DEFAULT_OPTIONS = { growable: false };

export class Uint8ArrayWriter implements IWriter<BufferOverflowError> {
  _INFER_ERROR: BufferOverflowError = null as never;
  private buffer: Uint8Array;
  private size: number;
  private growable: boolean;
  constructor(
    initialBuffer: Uint8Array = new Uint8Array(),
    options: { growable?: boolean } = DEFAULT_OPTIONS
  ) {
    this.buffer = initialBuffer;
    this.size = 0;
    this.growable = options.growable === true;
  }
  write = (data: Uint8Array): Result<number, BufferOverflowError> => {
    if (data.length <= 0) return ok(0);

    if (this.buffer.length >= this.size + data.length) {
      this.buffer.set(data, this.size);
      this.size += data.length;
      return ok(data.length);
    }
    if (this.growable) {
      this.growBy(data.length);
      return this.write(data);
    }
    return err(new BufferOverflowError());
  };
  private growBy(addition: number) {
    const newCapacity = Math.max(
      1,
      this.size + addition,
      getNewCapacity(this.buffer.length)
    );
    const newBuffer = new Uint8Array(newCapacity);
    newBuffer.set(this.buffer.subarray(0, this.size));
    this.buffer = newBuffer;
  }
  intoUint8Array = () => {
    const result = this.buffer.subarray(0, this.size);
    this.buffer = new Uint8Array();
    this.size = 0;
    return result;
  };
  clear(): void {
    this.size = 0;
  }
}
