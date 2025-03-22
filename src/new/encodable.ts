import { Pipeable } from "../pipe";
import { IEncodable, OutputByteStream } from "./types";

export abstract class Encodable<T, Results>
  extends Pipeable
  implements IEncodable<T, Results>
{
  __inferResults!: Results;
  __inferT!: T;
  abstract dataItems(value: T): number;
  abstract minDataItems(): number;
  abstract maxDataItems(): number;
  abstract encode(value: T, encoder: OutputByteStream): Results;
  abstract isNull(value: T): boolean;
}
