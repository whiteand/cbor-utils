import { Result } from "resultra";
import { AnyContextArgs, IEncodable, IEncoder, NotImportant } from "./types";

/**
 * @param current current buffer size
 * @param minimal requested minimal size
 * @returns next capacity of the buffer which is at least larger than minimal
 */
function nextSize(current: number, minimal: number) {
  current ||= 1;
  while (current < minimal) {
    current *= 2;
  }
  return current;
}

/**
 * Base class for all encoders
 */
abstract class BaseEncoder implements IEncoder {
  /** Buffer to write into during encoding */
  buf: Uint8Array;
  /**
   * Represents the current position of the encoder in the underlying buffer.
   */
  ptr: number;
  /** Represents the starting position of the encoder */
  offset: number;
  /**
   * Creates a new encoder with passed underlying buffer and initial position
   *
   * @param buffer Underlying buffer
   * @param ptr Initial position to write cbor into
   */
  constructor(buffer: Uint8Array = new Uint8Array(), ptr: number = 0) {
    this.buf = buffer;
    this.ptr = ptr;
    this.offset = ptr;
  }

  /**
   * Returns the current position of the cursor in the underlying buffer.
   *
   * It is used to backtrack encoding when there are several possible types that can encode the value.
   *
   * @returns position to be potentially restored later using `restore` method
   */
  save(): number {
    return this.ptr;
  }

  /**
   * Restores the position of the cursor in the underlying buffer.
   *
   * It is used for backtracking in the decoding of several possible types.
   *
   * @param value position of the cursor in the underlying buffer that should be restored
   */
  restore(value: number): this {
    if (this.buf.length > value) {
      this.ptr = value;
    } else {
      throw new Error("invalid restore position: " + value);
    }
    return this;
  }

  /**
   * Writes a byte to the underlying buffer.
   *
   * @param byte byte that should be appended to the underlying buffer
   * @returns this for chaining
   */
  write(byte: number): this {
    if (this.ptr >= this.buf.length) {
      this.realloc(nextSize(this.buf.length, this.buf.length + 1));
    }
    this.buf[this.ptr++] = byte;
    return this;
  }
  /**
   * Allocates larger buffer if necessary to resize the underlying buffer.
   *
   * @param newSize new size of the underlying buffer
   */
  private realloc(newSize: number) {
    if (newSize === this.buf.length) return;
    const newBuf = new Uint8Array(newSize);
    newBuf.set(this.buf);
    this.buf = newBuf;
  }
  reserve(size: number): this {
    const newSize = this.ptr + size;
    if (newSize >= this.buf.length) {
      this.realloc(nextSize(this.buf.length, newSize));
    }
    return this;
  }
  /**
   * Appends bytes to the underlying buffer.
   *
   * @param bytes bytes that should be appended to underlying buffer
   * @returns this for chaining
   */
  writeSlice(bytes: Uint8Array): this {
    if (this.ptr + bytes.length - 1 >= this.buf.length) {
      this.realloc(nextSize(this.buf.length, this.buf.length + bytes.length));
    }
    this.buf.set(bytes, this.ptr);
    this.ptr += bytes.length;
    return this;
  }
  /**
   * @returns the underlying buffer
   */
  finish(): Uint8Array {
    return this.buf.slice(this.offset, this.ptr);
  }
}

/**
 * Implementation of growable underlying buffer that is meant to be expanded by newly
 * created CBOR bytes.
 */
export class Encoder extends BaseEncoder implements IEncoder {
  /**
   * Encodes passed value into the underlying buffer.
   *
   * NOTE: Usually if you are using typescript and do not mess with types, encoding errors should not happen at all.
   *
   * @param ty type that will be used to encode value
   * @param value value to be encoded
   * @param args additional context argument (if necessary)
   * @returns ok if encoding was successful, error result otherwise
   */
  encode<T, EE extends Error, ECArgs extends AnyContextArgs>(
    ty: IEncodable<T, EE, ECArgs>,
    value: Readonly<T>,
    ...args: NoInfer<ECArgs>
  ): Result<void, EE> {
    return (ty.encode as NotImportant)(value, this, args[0]);
  }
}

/**
 * Implementation of an encoder interface that throws when encoding failed.
 *
 * Uses growable buffer under the hood.
 */
export class ThrowOnFailEncoder extends BaseEncoder implements IEncoder {
  /**
   * Encodes passed value into the underlying buffer.
   *
   * NOTE: Usually if you are using typescript and do not mess with types, encoding errors should not happen at all.
   *
   * @param ty type that will be used to encode value
   * @param value value to be encoded
   * @param args additional context argument (if necessary)
   * @returns void, because it throws an error if encoding fails
   */
  encode<T, EE extends Error, ECArgs extends AnyContextArgs>(
    ty: IEncodable<T, EE, ECArgs>,
    value: NoInfer<T>,
    ...args: NoInfer<ECArgs>
  ): void {
    return (ty.encode as NotImportant)(value, this, args[0]).unwrap();
  }
}
