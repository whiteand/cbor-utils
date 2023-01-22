import { IWriter } from "./types";

export class Encoder<W extends IWriter> {
  constructor(private readonly writer: W) {}
  getWriter(): W {
    return this.writer;
  }
}
