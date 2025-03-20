import { TaggedDataItem } from "./TaggedDataItem";

type PrimitiveDataItem =
  | number
  | bigint
  | Uint8Array
  | boolean
  | null
  | undefined
  | string
  | Simple<number>;

/**
 * DataItem describes all possible valid CBOR Data Items
 */
export interface ITaggedDataItem extends TaggedDataItem<DataItem> {}
export interface IMappedDataItem extends Map<DataItem, DataItem> {}
export interface IArrayedDataItem extends Array<DataItem> {}

/** Represents all possible cbor values */
export type DataItem =
  | ITaggedDataItem
  | IMappedDataItem
  | IArrayedDataItem
  | PrimitiveDataItem;

export class Simple<T extends number = number> {
  private static SIMPLES: Simple[] = [];
  private constructor(public readonly value: T) {}
  static of(number: number): Simple {
    if (!Number.isSafeInteger(number)) {
      throw new TypeError(`Impossible simple value: ${number}`);
    }
    if (number < 0) {
      throw new TypeError(`Simple value cannot be negative: ${number}`);
    }
    if (number > 255) {
      throw new TypeError(`Simple value cannot be more than 255: ${number}`);
    }
    for (let i = Simple.SIMPLES.length; i <= number; i++) {
      Simple.SIMPLES.push(new Simple(i));
    }
    return Simple.SIMPLES[number];
  }
  toString(): string {
    return `simple(${this.value})`;
  }
}
