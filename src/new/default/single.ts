import { Pipeable } from "../../pipe";
import { IDecodable, IEncodable } from "../types";
import { InputByteStream, OutputByteStream } from "../types";

export abstract class SingleDataItemEncodable<T, Results>
  extends Pipeable
  implements IEncodable<T, Results>
{
  __inferT!: T;
  __inferResults!: Results;
  dataItems(): number {
    return 1;
  }
  minDataItems(): number {
    return 1;
  }
  maxDataItems(): number {
    return 1;
  }
  abstract encode(value: T, encoder: OutputByteStream): Results;
  abstract isNull(value: T): boolean;
}
export abstract class SingleDataItemDecodable<T, Results>
  extends Pipeable
  implements IDecodable<T, Results>
{
  __inferT!: T;
  __inferResults!: Results;
  abstract decode(decoder: InputByteStream): Results;
  abstract getValue(): T;
  abstract nullValue(): T;
  abstract skip(decoder: InputByteStream): void;
  dataItems(): number {
    return 1;
  }
  minDataItems(): number {
    return 1;
  }
  maxDataItems(): number {
    return 1;
  }
}
