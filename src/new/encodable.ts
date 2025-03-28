import { Pipeable } from "../pipe";
import { IEncodable, OutputByteStream, SuccessResult } from "./types";

export abstract class Encodable<T, Results>
  extends Pipeable
  implements IEncodable<T, Results>
{
  __inferT!: T;
  __inferResults!: Results;

  abstract isNull(value: T): boolean;
  abstract dataItems(value: T): number;
  abstract minDataItems(): number;
  abstract maxDataItems(): number;
  abstract encode(value: T, output: OutputByteStream): Results;

  /**
   * Maps value before encoding using passed function.
   *
   * @param f Function that transforms value before encoding
   * @returns a new encoder that applies the function `f` before encoding
   */
  map<U>(f: (value: U) => T): Encodable<U, Results> {
    return new (class extends Encodable<U, Results> {
      private readonly convertCache: { input: U; result: T }[] = [];
      private readonly cacheCapacity = 1;
      constructor(
        private readonly original: IEncodable<T, Results>,
        private readonly f: (value: U) => T
      ) {
        super();
      }

      convert(value: U): T {
        for (let i = this.convertCache.length - 1; i >= 0; i--) {
          const { input, result } = this.convertCache[i];
          if (input === value) {
            return result;
          }
        }
        const t = this.f(value);
        this.convertCache.push({ input: value, result: t });
        if (this.convertCache.length > this.cacheCapacity) {
          this.convertCache.shift();
        }
        return t;
      }

      isNull(value: U): boolean {
        return this.original.isNull(this.convert(value));
      }
      dataItems(value: U): number {
        return this.original.dataItems(this.convert(value));
      }
      minDataItems(): number {
        return this.original.minDataItems();
      }
      maxDataItems(): number {
        return this.original.maxDataItems();
      }
      encode(value: U, output: OutputByteStream): Results {
        const t = this.convert(value);
        return this.original.encode(t, output);
      }
    })(this, f);
  }

  /**
   * Fallibly mapsvalue before encoding using passed function.
   *
   * @param f Function that transforms value before decoding
   * @returns a new encoder that applies the function `f` to encoded value before encoding
   */
  tryMap<U, R extends number>(
    f: (value: U, receiver: { value: T }) => R
  ): Encodable<U, Results | R> {
    return new (class extends Encodable<U, Results | R> {
      source!: U;
      hasSource: boolean = false;
      value!: T;
      constructor(
        private readonly original: IEncodable<T, Results>,
        private readonly f: (value: U, receiver: { value: T }) => R
      ) {
        super();
      }
      convert(value: U): SuccessResult | R {
        if (this.hasSource && this.source == value) {
          return 0;
        }
        const res = this.f(value, this);
        if (res !== 0) {
          return res;
        }
        this.hasSource = true;
        this.source = value;
        return 0;
      }
      isNull(value: U): boolean {
        return this.convert(value) === 0 && this.original.isNull(this.value);
      }
      dataItems(value: U): number {
        return this.convert(value) === 0
          ? this.original.dataItems(this.value)
          : 0;
      }
      minDataItems(): number {
        return this.original.minDataItems();
      }
      maxDataItems(): number {
        return this.original.maxDataItems();
      }
      encode(value: U, output: OutputByteStream): Results | R {
        const res = this.convert(value);
        if (res !== 0) return res;
        return this.original.encode(this.value, output);
      }
    })(this, f);
  }
}
