export type DataItem = number | bigint | TaggedDataItem;

export class TaggedDataItem<T extends DataItem = DataItem> {
  constructor(
    public readonly tag: number | bigint,
    public readonly value: T,
  ) {}
}
