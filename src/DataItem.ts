export type DataItem =
  | number
  | bigint
  | TaggedDataItem
  | Uint8Array
  | boolean
  | null
  | undefined
  | Map<DataItem, DataItem>
  | string
  | DataItem[]
  | Simple<number>;

export class Simple<T extends number = number> {
  constructor(public readonly value: T) {}
}

export class TaggedDataItem<T extends DataItem = DataItem> {
  constructor(
    public readonly tag: number | bigint,
    public readonly value: T,
  ) {}
}
