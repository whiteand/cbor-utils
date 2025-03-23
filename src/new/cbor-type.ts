import { Pipeable } from "../pipe";
import {
  AnyDecodable,
  AnyEncodable,
  InferResults,
  InferType,
  InputByteStream,
  IType,
  OutputByteStream,
} from "./types";

export class CborType<E, D> extends Pipeable implements IType<E, D> {
  __inferDecoder!: D;
  __inferEncoder!: E;
  constructor(private readonly e: E, private readonly d: D) {
    super();
  }
  encode(value: InferType<E>, output: OutputByteStream): InferResults<E> {
    return (this.e as AnyEncodable).encode(value, output);
  }
  decode(input: InputByteStream): InferResults<D> {
    return (this.d as AnyDecodable).decode(input);
  }
  encoder(): E {
    return this.e;
  }
  decoder(): D {
    return this.d;
  }
}
