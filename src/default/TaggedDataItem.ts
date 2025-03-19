export class TaggedDataItem<T> {
  constructor(public readonly tag: number | bigint, public readonly value: T) {}
}
