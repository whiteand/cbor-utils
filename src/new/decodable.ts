import { Pipeable } from "../pipe";
import { IDecodable, InputByteStream } from "./types";

export abstract class Decodable<T, Results>
  extends Pipeable
  implements IDecodable<T, Results>
{
  abstract dataItems(
    input: InputByteStream,
    receiver: { value: number }
  ): Results;
  abstract nullValue(): T;
  abstract hasNullValue(): boolean;
  abstract skip(input: InputByteStream): Results;
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
      dataItems(
        input: InputByteStream,
        receiver: {
          value: number;
        }
      ): Results {
        return this.original.dataItems(input, receiver);
      }
      minDataItems(): number {
        return this.original.minDataItems();
      }
      maxDataItems(): number {
        return this.original.maxDataItems();
      }
      hasNullValue(): boolean {
        return this.original.hasNullValue();
      }
    })(this, f);
  }

  /**
   * Fallibly maps decoded value using passed function.
   *
   * @param f Function that transforms decoded value after decoding
   * @param nullValue function that returns a value that corresponds to `null` data item or absent data item
   * @returns a new decoder that applies the function `f` to decoded value
   */
  tryMap<U, R extends number>(
    f: (value: T, receiver: { value: U }) => R,
    nullValue: () => U
  ): Decodable<U, Results | R> {
    return new (class extends Decodable<U, Results | R> {
      value!: U;
      constructor(
        private readonly original: IDecodable<T, Results>,
        private readonly f: (value: T, receiver: { value: U }) => R,
        private readonly getNull: () => U
      ) {
        super();
      }
      nullValue(): U {
        return this.getNull();
      }
      skip(input: InputByteStream): Results | R {
        return this.original.skip(input);
      }
      dataItems(input: InputByteStream, r: { value: number }): Results {
        return this.original.dataItems(input, r);
      }
      minDataItems(): number {
        return this.original.minDataItems();
      }
      maxDataItems(): number {
        return this.original.minDataItems();
      }
      decode(input: InputByteStream): Results | R {
        const res = this.original.decode(input);
        if (res !== 0) return res;
        const value = this.original.getValue();
        return this.f(value, this);
      }
      getValue() {
        return this.value;
      }
      hasNullValue(): boolean {
        return this.original.hasNullValue();
      }
    })(this, f, nullValue);
  }
}
