export type DataItem =
  | number
  | bigint
  | TaggedDataItem<DataItem>
  | Uint8Array
  | boolean
  | null
  | undefined
  | Map<DataItem, DataItem>
  | string
  | DataItem[]
  | Simple<number>;

export class Simple<T extends number = number> {
  private static SIMPLES: Simple[] = [];
  private constructor(public readonly value: T) {}
  static of(number: number) {
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
  toString() {
    return `simple(${this.value})`;
  }
}

export class TaggedDataItem<T> {
  constructor(public readonly tag: number | bigint, public readonly value: T) {}
}
