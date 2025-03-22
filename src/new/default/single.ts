import { Decodable } from "../decodable";
import { Encodable } from "../encodable";
import { InputByteStream, OutputByteStream } from "../types";

export abstract class SingleDataItemEncodable<T, Results> extends Encodable<
  T,
  Results
> {
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
export abstract class SingleDataItemDecodable<T, Results> extends Decodable<
  T,
  Results
> {
  abstract decode(decoder: InputByteStream): Results;
  abstract getValue(): T;
  abstract nullValue(): T;
  abstract skip(decoder: any): void;
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
