import { Result } from "resultra";
import { BREAK } from "./constants";
import { Decoder } from "./Decoder";

export class ArrayIter<Item>
  implements Iterator<Result<Item>>, Iterable<Result<Item>>
{
  private finished: boolean;
  constructor(
    private decoder: Decoder<any>,
    private len: number | bigint | null,
    private parseItem: (item: any) => Result<Item>
  ) {
    this.finished = false;
  }
  [Symbol.iterator](): Iterator<Result<Item>, any, undefined> {
    return this;
  }
  private finish(): IteratorResult<Result<Item>, unknown> {
    this.finished = true;
    return { done: true, value: undefined };
  }
  next(): IteratorResult<Result<Item>, any> {
    if (this.finished || this.len === 0) {
      return { done: true, value: undefined };
    }
    if (this.len == null) {
      const currentByte = this.decoder.peek();
      if (!currentByte.ok()) return this.finish();
      const b = currentByte.unwrap();
      if (b === BREAK) {
        const r = this.decoder.read();
        if (!r.ok()) {
          return { done: false, value: r };
        }
        return this.finish();
      }
      const item = this.parseItem(this.decoder);
      return { done: false, value: item };
    }
    this.len = typeof this.len === "number" ? this.len - 1 : this.len - 1n;
    const item = this.parseItem(this.decoder);
    return { done: false, value: item };
  }
}
