import { IPipeable } from "../pipe";
import { IDecoder, IEncoder, Z } from "../types";

export interface OutputByteStream extends IEncoder {}

export interface InputByteStream extends IDecoder {}

export type SuccessResult = 0;

export interface Inferable<T, R> {
  __inferT: T;
  __inferResults: R;
}

export type InferTypeInner<T extends { __inferT: Z }> = T["__inferT"];
export type InferResultsInner<T extends { __inferResults: Z }> =
  T["__inferResults"];

export type InferType<T> = T extends T
  ? T extends { __inferT: Z }
    ? InferTypeInner<T>
    : never
  : never;

export type InferResults<T> = T extends T
  ? T extends { __inferResults: Z }
    ? InferResultsInner<T["__inferResults"]>
    : never
  : never;

export type AnyEncodable = IEncodable<Z, Z>;

export interface WithEncodeMethod<T, Results> {
  /**
   * Encodes the value of type T into output byte stream output
   * @param value value that should be encoded
   * @param output encoder into which the value will be encoded
   */
  encode(value: T, output: OutputByteStream): Results;
}

export interface IEncodable<T, Results>
  extends IPipeable,
    Inferable<T, Results>,
    WithEncodeMethod<T, Results> {
  /**
   * Will the value be encoded as 0xf6 (null) data item
   *
   * @param value value that should be encoded
   */
  isNull(value: T): boolean;

  /**
   * How many data items will be added into encoder
   * @param value value that should be encoded
   */
  dataItems(value: T): number;

  /**
   * What is the minimal number of data items that will be added into encoder potentially
   */
  minDataItems(): number;

  /**
   * What is the minimal number of data items that will be added into encoder potentially
   * When returns Number.MAX_SAFE_INTEGER it means that there is no limit
   */
  maxDataItems(): number;
}

export type AnyDecodable = IDecodable<Z, Z>;

export interface WithDecodeAndGetValue<T, Results> {
  /**
   * Returns 0 if the value was successfully decoded.
   * Otherwise returns error code.
   * You can get the error message from the documentation of the concrete decoder.
   * If value successfully decoded (returned value is 0), you can receive decoded value from getValue method.
   *
   * @param input decoder from which the value will be decoded
   */
  decode(input: InputByteStream): Results;
  /**
   * Returns decoded value, if the data item was successfully decoded.
   * Unsafe: ensure that decode operation returned 0.
   */
  getValue(): T;
}

export interface IDecodable<T, Results>
  extends IPipeable,
    Inferable<T, Results>,
    WithDecodeAndGetValue<T, Results> {
  /**
   * Returns the value that will be returned when the data item is absent (or null)
   */
  nullValue(): T;
  /**
   * Returns true if the data can be null.
   * If it returns true, `nullValue` should return valid value.
   */
  hasNullValue(): boolean;
  /**
   * Skips the encoded structure item in decoder
   */
  skip(input: InputByteStream): Results;

  /**
   * The number of data items that will be read from decoder
   * @param input decoder from which the data items will be read
   */
  dataItems(input: InputByteStream): void;
  /**
   * How many data items will be read from decoder
   */
  minDataItems(): number;
  /**
   * How much potentiall data items will be read from decoder.
   * Return Number.MAX_SAFE_INTEGER if there is no limit
   */
  maxDataItems(): number;
}

export type AnyType = IType<Z, Z>;

interface TypeInferable<E, D> {
  __inferEncoder: E;
  __inferDecoder: D;
}

export type InferEncoderInner<T extends { __inferEncoder: Z }> =
  T["__inferEncoder"];

export type InferDecoderInner<T extends { __inferDecoder: Z }> =
  T["__inferDecoder"];

export type InferEncoder<T> = T extends T
  ? T extends { __inferEncoder: Z }
    ? InferEncoderInner<T>
    : never
  : never;

export type InferDecoder<T> = T extends T
  ? T extends { __inferDecoder: Z }
    ? InferDecoderInner<T>
    : never
  : never;

export interface IType<E, D> extends IPipeable, TypeInferable<E, D> {
  encoder(): E;
  decoder(): D;
  encode(value: InferType<E>, output: OutputByteStream): InferResults<E>;
  decode(input: InputByteStream): InferResults<D>;
}

export type InferEncodedType<T> = InferType<InferEncoder<T>>;
export type InferDecodedType<T> = InferType<InferDecoder<T>>;
