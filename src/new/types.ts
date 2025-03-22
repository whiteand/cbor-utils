import { IPipeable } from "../pipe";
import { IDecoder, IEncoder, Z } from "../types";

export type SuccessResult = 0;

export interface Inferable<T> {
  __inferT: T;
}

export type AnyEncodable = IEncodable<Z, Z>;

export interface IEncodable<T, Results> extends IPipeable, Inferable<T> {
  /**
   *
   * @param value value that should be encoded
   * @param encoder encoder into which the value will be encoded
   */
  encode(value: T, encoder: IEncoder): Results;
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

export interface IDecodable<T, Results> extends IPipeable, Inferable<T> {
  /**
   * Returns 0 if the value was successfully decoded.
   * Otherwise returns error code.
   * You can get the error message from the documentation of the concrete decoder.
   * If value successfully decoded (returned value is 0), you can receive decoded value from getValue method.
   *
   * @param decoder decoder from which the value will be decoded
   */
  decode(decoder: IDecoder): Results;
  /**
   * Returns decoded value, if the data item was successfully decoded.
   * Unsafe: ensure that decode operation returned 0.
   */
  getValue(): T;
  /**
   * Returns the value that will be returned when the data item is absent (or null)
   */
  nullValue(): T;
  /**
   * Skips the encoded structure item in decoder
   */
  skip(decoder): void;
  /*
   * How many bytes will be read from decoder
   */
  byteLength(decoder): number;
  /**
   * The number of data items that will be read from decoder
   * @param decoder decoder from which the data items will be read
   */
  dataItems(decoder): void;
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

export type AnyType = IType<Z, Z, Z, Z>;

export interface IType<ET, DT, EE, DE> extends IPipeable {
  encoder: IEncodable<ET, EE>;
  decoder: IDecodable<DT, DE>;
}
