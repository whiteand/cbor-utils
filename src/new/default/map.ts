import { BREAK_BYTE } from "../../constants";
import { done } from "../done";
import { EOI_ERROR_CODE } from "../error-codes";
import {
  IDecodable,
  IEncodable,
  InferResults,
  InferType,
  InputByteStream,
  OutputByteStream,
  WithDecodeAndGetValue,
  WithEncodeMethod,
} from "../types";
import {
  MarkerDecoder,
  MarkerDecoderResults,
  MarkerEncoder,
  MarkerEncoderResults,
} from "./marker";
import { SingleDataItemDecodable, SingleDataItemEncodable } from "./single";
import { takeSuffix } from "../suffix";
import { CborType } from "../cbor-type";
import { mapLen } from "./mapLen";
import { Z } from "../../types";

interface IReadonlyMap<K, V> {
  entries(): Iterable<[K, V]>;
  size: number;
}

interface IMapBuilder<K, V, C> {
  set(key: K, value: V): void;
  build(): C;
}

class ObjectReadonlyMap<K extends string | number, V> {
  public readonly size: number;
  constructor(private readonly obj: Record<K, V>) {
    this.size = Object.keys(obj).length;
  }
  entries(): Iterable<[K, V]> {
    return Object.entries(this.obj) as Iterable<[K, V]>;
  }
}

class MapEncoder<
  K,
  KR,
  V,
  VR,
  C extends IReadonlyMap<K, V>
> extends SingleDataItemEncodable<C, KR | VR | MarkerEncoderResults> {
  constructor(
    private readonly k: WithEncodeMethod<K, KR>,
    private readonly v: WithEncodeMethod<V, VR>,
    private readonly marker: MarkerEncoder
  ) {
    super();
  }
  encode(value: C, encoder: OutputByteStream): KR | VR | MarkerEncoderResults {
    let res: KR | VR | MarkerEncoderResults = this.marker.encode(
      value.size,
      encoder
    );
    if (res !== 0) return res;
    for (const [key, val] of value.entries()) {
      res = this.k.encode(key, encoder);
      if (res !== 0) return res;
      res = this.v.encode(val, encoder);
      if (res !== 0) return res;
    }

    return res;
  }
  isNull(value: C): boolean {
    return false;
  }
}

class MapBuilder<K, V> implements IMapBuilder<K, V, Map<K, V>> {
  private readonly map: Map<any, any>;
  constructor() {
    this.map = new Map();
  }
  set(key: K, value: V): void {
    this.map.set(key, value);
  }
  build(): Map<K, V> {
    return this.map;
  }
}

class ObjectBuilder<K extends string | number, V>
  implements IMapBuilder<K, V, Record<K, V>>
{
  private readonly obj: Record<K, V>;
  constructor() {
    this.obj = {} as Record<K, V>;
  }
  set(key: K, value: V): void {
    this.obj[key] = value;
  }
  build(): Record<K, V> {
    return this.obj;
  }
}

class MapDecoder<K, KR, V, VR, C> extends SingleDataItemDecodable<
  C,
  KR | VR | MarkerDecoderResults
> {
  b: IMapBuilder<K, V, C>;

  constructor(
    private readonly k: WithDecodeAndGetValue<K, KR> & {
      skip(i: InputByteStream): KR;
    },
    private readonly v: WithDecodeAndGetValue<V, VR> & {
      skip(i: InputByteStream): VR;
    },
    private readonly marker: MarkerDecoder,
    private readonly builder: () => IMapBuilder<K, V, C>
  ) {
    super();
  }

  nullValue(): C {
    return this.builder().build();
  }
  hasNullValue(): boolean {
    return false;
  }
  protected decodeItem(input: InputByteStream): KR | VR | MarkerDecoderResults {
    let res: KR | VR | MarkerDecoderResults = this.marker.decode(input);
    if (res !== 0) return res;

    const keyStart = this.k.values.length;
    const valueStart = this.v.values.length;

    res = this.marker.isNull()
      ? this.decodeUndefined(input)
      : this.decodeDefined(
          input,
          this.marker.isNumber()
            ? this.marker.getNumber()
            : Number(this.marker.getBigInt())
        );

    const keys = takeSuffix(keyStart, this.k.values);
    const values = takeSuffix(valueStart, this.v.values);

    if (res !== 0) {
      return res;
    }

    this.b = this.builder();

    if ((this.k.values as any[]) === (this.v.values as any[])) {
      // Key and value type are the same
      for (let i = 0; i < keys.length; i += 2) {
        this.b.set(keys[i], keys[i + 1] as Z as V);
      }
    } else {
      for (let i = 0; i < keys.length; i++) {
        this.b.set(keys[i], values[i]);
      }
    }

    this.values.push(this.b.build());

    return res;
  }
  decodeDefined(
    input: InputByteStream,
    len: number
  ): KR | VR | MarkerDecoderResults {
    let res: KR | VR | MarkerDecoderResults = 0;
    for (let i = 0; i < len; i++) {
      res = this.k.decode(input);
      if (res !== 0) return res;
      res = this.v.decode(input);
      if (res !== 0) return res;
    }
    return res;
  }
  decodeUndefined(input: InputByteStream): KR | VR | MarkerDecoderResults {
    let res: KR | VR | MarkerDecoderResults = 0;
    while (true) {
      if (done(input)) return EOI_ERROR_CODE;
      const m = input.buf[input.ptr];
      if (m === BREAK_BYTE) {
        input.ptr++;
        break;
      }
      res = this.k.decode(input);
      if (res !== 0) return res;
      res = this.v.decode(input);
      if (res !== 0) return res;
    }
    return res;
  }
  protected skipItem(input: InputByteStream): KR | VR | MarkerDecoderResults {
    let res: KR | VR | MarkerDecoderResults = this.marker.decode(input);
    if (res !== 0) return res;
    if (this.marker.isNull()) {
      res = this.skipUndefined(input);
    } else {
      res = this.skipDefined(
        input,
        this.marker.isNumber()
          ? this.marker.getNumber()
          : Number(this.marker.getBigInt())
      );
    }
    return res;
  }
  skipDefined(
    input: InputByteStream,
    len: number
  ): KR | VR | MarkerDecoderResults {
    let res: KR | VR | MarkerDecoderResults = 0;
    for (let i = 0; i < len; i++) {
      res = this.k.skip(input);
      if (res !== 0) return res;
      res = this.v.skip(input);
      if (res !== 0) return res;
    }
    return res;
  }
  skipUndefined(input: InputByteStream): KR | VR | MarkerDecoderResults {
    let res: KR | VR | MarkerDecoderResults = 0;
    while (true) {
      if (done(input)) return EOI_ERROR_CODE;
      const m = input.buf[input.ptr];
      if (m === BREAK_BYTE) {
        input.ptr++;
        break;
      }
      res = this.k.skip(input);
      if (res !== 0) return res;
      res = this.v.skip(input);
      if (res !== 0) return res;
    }
    return res;
  }

  static toMap<K, KR, V, VR>(
    k: WithDecodeAndGetValue<K, KR> & { skip(i: InputByteStream): KR },
    v: WithDecodeAndGetValue<V, VR> & { skip(i: InputByteStream): VR },
    marker: MarkerDecoder
  ): MapDecoder<K, KR, V, VR, Map<K, V>> {
    return new MapDecoder(k, v, marker, () => new MapBuilder<K, V>());
  }

  static toObject<K extends string | number, KR, V, VR>(
    k: WithDecodeAndGetValue<K, KR> & { skip(i: InputByteStream): KR },
    v: WithDecodeAndGetValue<V, VR> & { skip(i: InputByteStream): VR },
    marker: MarkerDecoder
  ): MapDecoder<K, KR, V, VR, Record<K, V>> {
    return new MapDecoder(k, v, marker, () => new ObjectBuilder<K, V>());
  }
}

export function mapAsMap<KE, KD, VE, VD>(
  key: CborType<KE, KD>,
  value: CborType<VE, VD>
): CborType<
  MapEncoder<
    InferType<KE>,
    InferResults<KE>,
    InferType<VE>,
    InferResults<VE>,
    IReadonlyMap<InferType<KE>, InferType<VE>>
  >,
  MapDecoder<
    InferType<KD>,
    InferResults<KD>,
    InferType<VD>,
    InferResults<VD>,
    Map<InferType<KD>, InferType<VD>>
  >
> {
  return new CborType(
    new MapEncoder(
      key.encoder() as IEncodable<InferType<KE>, InferResults<KE>>,
      value.encoder() as IEncodable<InferType<VE>, InferResults<VE>>,
      mapLen.encoder()
    ),
    MapDecoder.toMap(
      key.decoder() as IDecodable<InferType<KD>, InferResults<VD>>,
      value.decoder() as IDecodable<InferType<VD>, InferResults<VE>>,
      mapLen.decoder()
    )
  );
}
