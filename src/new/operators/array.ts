import { CborType } from "../cbor-type";
import { arrayLen } from "../default/arrayLen";
import {
  MarkerDecoder,
  MarkerDecoderResults,
  MarkerEncoder,
  MarkerEncoderResults,
} from "../default/marker";
import {
  SingleDataItemDecodable,
  SingleDataItemEncodable,
} from "../default/single";
import { done } from "../done";
import { EOI_ERROR_CODE } from "../error-codes";
import {
  IDecodable,
  InferResults,
  InferType,
  InputByteStream,
  OutputByteStream,
  SuccessResult,
  WithEncodeMethod,
} from "../types";

class ArrayEncoder<T, R> extends SingleDataItemEncodable<
  readonly T[],
  R | MarkerEncoderResults
> {
  constructor(
    private readonly it: WithEncodeMethod<T, R>,
    private readonly m: MarkerEncoder
  ) {
    super();
  }

  encode(v: readonly T[], e: OutputByteStream): R | MarkerEncoderResults {
    const len = v.length;
    let res: R | MarkerEncoderResults = this.m.encode(len, e);
    if (res !== 0) return res;
    for (let i = 0; i < len; i++) {
      res = this.it.encode(v[i], e);
      if (res !== 0) return res;
    }
    return 0;
  }
  isNull(): boolean {
    return false;
  }
}

class ArrayDecoder<T, R> extends SingleDataItemDecodable<
  T[],
  R | MarkerDecoderResults
> {
  result: T[] = [];
  constructor(
    private readonly it: IDecodable<T, R>,
    private readonly m: MarkerDecoder
  ) {
    super();
  }

  getValue(): T[] {
    return this.result;
  }
  nullValue(): T[] {
    return [];
  }
  hasNullValue(): boolean {
    return false;
  }
  protected decodeItem(input: InputByteStream): R | MarkerDecoderResults {
    const res: R | MarkerDecoderResults = this.m.decode(input);
    if (res !== 0) return res;
    if (this.m.isNull()) {
      return this.decodeIndefiniteArray(input);
    }
    const len = this.m.isNumber()
      ? this.m.getNumber()
      : Number(this.m.getBigInt());
    return this.decodeDefiniteArray(input, len);
  }
  private decodeDefiniteArray(
    input: InputByteStream,
    len: number
  ): R | SuccessResult {
    const result: T[] = [];
    for (let i = 0; i < len; i++) {
      const res = this.it.decode(input);
      if (res !== 0) return res;
      result.push(this.it.getValue());
    }
    this.result = result;
    return 0;
  }
  private decodeIndefiniteArray(
    input: InputByteStream
  ): R | typeof EOI_ERROR_CODE | SuccessResult {
    const result: T[] = [];
    let res: R;
    while (true) {
      if (done(input)) {
        return EOI_ERROR_CODE;
      }
      const m = input.buf[input.ptr];
      if (m === 0xff) {
        input.ptr++;
        break;
      }
      res = this.it.decode(input);
      if (res !== 0) return res;
      result.push(this.it.getValue());
    }
    this.result = result;
    return 0;
  }
  private skipDefiniteArray(
    input: InputByteStream,
    len: number
  ): R | SuccessResult {
    const result: T[] = [];
    for (let i = 0; i < len; i++) {
      const res = this.it.skip(input);
      if (res !== 0) return res;
      result.push(this.it.getValue());
    }
    this.result = result;
    return 0;
  }
  private skipIndefiniteArray(
    input: InputByteStream
  ): R | typeof EOI_ERROR_CODE | SuccessResult {
    const result: T[] = [];
    let res: R;
    while (true) {
      if (done(input)) {
        return EOI_ERROR_CODE;
      }
      const m = input.buf[input.ptr];
      if (m === 0xff) {
        input.ptr++;
        break;
      }
      res = this.it.skip(input);
      if (res !== 0) return res;
      result.push(this.it.getValue());
    }
    this.result = result;
    return 0;
  }

  protected skipItem(input: InputByteStream): R | MarkerDecoderResults {
    const res: R | MarkerDecoderResults = this.m.decode(input);
    if (res !== 0) return res;
    if (this.m.isNull()) {
      return this.skipIndefiniteArray(input);
    }
    const len = this.m.isNumber()
      ? this.m.getNumber()
      : Number(this.m.getBigInt());
    return this.skipDefiniteArray(input, len);
  }
}

export function array(): <E, D>(
  type: CborType<E, D>
) => CborType<
  ArrayEncoder<InferType<E>, InferResults<E>>,
  ArrayDecoder<InferType<D>, InferResults<D>>
> {
  return <E, D>(ty: CborType<E, D>) =>
    new CborType(
      new ArrayEncoder<InferType<E>, InferResults<E>>(
        ty.encoder() as WithEncodeMethod<InferType<E>, InferResults<E>>,
        arrayLen.encoder()
      ),
      new ArrayDecoder(
        ty.decoder() as IDecodable<InferType<D>, InferResults<D>>,
        arrayLen.decoder()
      )
    );
}
