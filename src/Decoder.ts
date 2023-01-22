import { IReader } from "./types";

export class Decoder<R extends IReader> {
  constructor(private readonly reader: R) {}
  getReader(): R {
    return this.reader;
  }
}
