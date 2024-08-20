import { err } from "resultra";
import { NotImplementedError } from "./errors";
import { Pipeable } from "./pipe";

const getDefaultEncode = () => () => err(new NotImplementedError("encode"));
const getDefaultDecode = () => () => err(new NotImplementedError("decode"));

export function CborBuilder() {
    this._encode = getDefaultEncode()
    this._decode = getDefaultDecode()
}

Object.assign(CborBuilder.prototype, {
    encode(encode) {
        this._encode = encode;
        return this
    },
    decode(decode) {
        this._decode = decode;
        return this
    },
    build() {
        return new CborType(this._encode, this._decode)
    }
})

export function CborType(encode, decode) {
    this.encode = encode
    this.decode = decode
}

Reflect.setPrototypeOf(CborType.prototype, Pipeable.prototype)

CborType.builder = function () {
    return new CborBuilder()
}

CborType.prototype.convert = function convert(
    toNewDecodedValue,
    toOldEncodedValue
) {
    return createConvertedType(this, toNewDecodedValue, toOldEncodedValue)
}

export function createConvertedType(inner, toNewDecodedValue, toOldEncodedValue) {
    function ConvertedType() { }

    Reflect.setPrototypeOf(ConvertedType.prototype, inner)

    Object.assign(ConvertedType.prototype, {
        encode(value, encoder, ctx) {
            return super.encode(toOldEncodedValue(value), encoder, ctx)
        },
        decode(decoder, ctx) {
            return super.decode(decoder, ctx).map(toNewDecodedValue)
        }
    })

    return new ConvertedType()
}