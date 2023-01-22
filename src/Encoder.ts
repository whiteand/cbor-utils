import { Uint8ArrayWriter } from "./defaults/Uint8ArrayWriter";
import { IWriter } from "./types";

export class Encoder {
  constructor(private readonly writer: IWriter = new Uint8ArrayWriter()) {}
  getWriter(): IWriter {
    return this.writer;
  }
}
