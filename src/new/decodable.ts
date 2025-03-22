import { Pipeable } from "../pipe";
import { IDecodable, InputByteStream } from "./types";

export abstract class Decodable<T, Results>
  extends Pipeable
  implements IDecodable<T, Results>
{
  __inferResults!: Results;
  __inferT!: T;
  /**
   * Returns 0 if the value was successfully decoded.
   * Otherwise returns error code.
   * You can get the error message from the documentation of the concrete decoder.
   * If value successfully decoded (returned value is 0), you can receive decoded value from getValue method.
   *
   * @param decoder decoder from which the value will be decoded
   */
  abstract decode(decoder: InputByteStream): Results;
  /**
   * Returns decoded value, if the data item was successfully decoded.
   * Unsafe: ensure that decode operation returned 0.
   */
  abstract getValue(): T;
  /**
   * Returns the value that will be returned when the data item is absent (or null)
   */
  abstract nullValue(): T;
  /**
   * Skips the encoded structure item in decoder
   */
  abstract skip(decoder: InputByteStream): Results;
  /**
   * The number of data items that will be read from decoder assuming that the data item is validly encoded
   * @param decoder decoder from which the data items will be read
   */
  abstract dataItems(decoder: InputByteStream): number;
  /**
   * How many data items will be read from decoder
   */
  abstract minDataItems(): number;
  /**
   * How much potentiall data items will be read from decoder.
   * Return Number.MAX_SAFE_INTEGER if there is no limit
   */
  abstract maxDataItems(): number;
}
