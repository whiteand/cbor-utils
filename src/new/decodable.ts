import { Pipeable } from "../pipe";
import { IDecodable, InputByteStream } from "./types";

export abstract class Decodable<T, Results>
  extends Pipeable
  implements IDecodable<T, Results>
{
  abstract nullValue(): T;
  abstract skip(input: InputByteStream): Results;
  abstract dataItems(input: InputByteStream): void;
  abstract minDataItems(): number;
  abstract maxDataItems(): number;
  __inferT: T;
  __inferResults: Results;
  abstract decode(input: InputByteStream): Results;
  abstract getValue();

  /**
   * Maps decoded value using passed function.
   *
   * @param f Function that transforms decoded value after decoding
   * @returns a new decoder that applies the function `f` to decoded value
   */
  map<U>(f: (value: T) => U): Decodable<U, Results> {
    return new (class extends Decodable<U, Results> {
      constructor(
        private readonly original: IDecodable<T, Results>,
        private readonly f: (value: T) => U
      ) {
        super();
      }
      decode(input: InputByteStream): Results {
        return this.original.decode(input);
      }
      getValue(): U {
        return this.f(this.original.getValue());
      }
      nullValue(): U {
        return this.f(this.original.nullValue());
      }
      skip(input: InputByteStream): Results {
        return this.original.skip(input);
      }
      dataItems(input: InputByteStream): void {
        return this.original.dataItems(input);
      }
      minDataItems(): number {
        return this.original.minDataItems();
      }
      maxDataItems(): number {
        return this.original.maxDataItems();
      }
    })(this, f);
  }
}
