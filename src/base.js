import { err } from "resultra";
import { NotImplementedError } from "./errors";
import { Pipeable } from "./pipe";

const getDefaultEncode = () => () => err(new NotImplementedError("encode"));
const getDefaultDecode = () => () => err(new NotImplementedError("decode"));

export function CborBuilder() {
  this._encode = getDefaultEncode();
  this._decode = getDefaultDecode();
  this._nullable = false;
}

Object.assign(CborBuilder.prototype, {
  encode(encode) {
    this._encode = encode;
    return this;
  },
  decode(decode) {
    this._decode = decode;
    return this;
  },
  nullable(value = true) {
    this._nullable = value;
    return this;
  },
  build() {
    return new CborType(this._encode, this._decode, this._nullable);
  },
});

export function CborType(encode, decode, nullable) {
  this.encode = encode;
  this.decode = decode;
  this.nullable = nullable;
}

Reflect.setPrototypeOf(CborType.prototype, Pipeable.prototype);

CborType.builder = function () {
  return new CborBuilder();
};

CborType.from = function (ty) {
  return ty instanceof CborType
    ? ty
    : CborType.builder()
        .encode((v, e, c) => ty.encode(v, e, c))
        .decode((d, c) => ty.decode(d, c))
        .nullable(ty.nullable)
        .build();
};

Object.assign(CborType.prototype, {
  convert(toNewDecodedValue, toOldEncodedValue) {
    return createConvertedType(this, toNewDecodedValue, toOldEncodedValue);
  },
});

export function createConvertedType(
  inner,
  toNewDecodedValue,
  toOldEncodedValue
) {
  function ConvertedType() {}

  Reflect.setPrototypeOf(ConvertedType.prototype, inner);

  Object.assign(ConvertedType.prototype, {
    encode(value, encoder, ctx) {
      return super.encode(toOldEncodedValue(value), encoder, ctx);
    },
    decode(decoder, ctx) {
      return super.decode(decoder, ctx).map(toNewDecodedValue);
    },
  });

  return new ConvertedType();
}
