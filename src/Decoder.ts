import { Uint8ArrayReader } from "./defaults/Uint8ArrayReader";
import { IReader } from "./types";

export class Decoder {
  constructor(private readonly reader: IReader = new Uint8ArrayReader()) {}
  getReader(): IReader {
    return this.reader;
  }
}
