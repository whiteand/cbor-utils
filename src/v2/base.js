import { err } from "resultra";
import { NotImplementedError } from "./errors";
import { Pipeable } from "./pipe";

const getDefaultEncode = () => () => err(new NotImplementedError("encode"));
const getDefaultDecode = () => () => err(new NotImplementedError("decode"));

export function CborBuilder() {
    this.encode = getDefaultEncode()
    this.decode = getDefaultDecode()
}

CborBuilder.prototype.encode = function setEncode(encode) {
    this.encode = encode;
}
CborBuilder.prototype.decode = function setEncode(decode) {
    this.decode = decode;
}
CborBuilder.prototype.build = function build() {
    return new CborType(this.encode, this.decode)
}

export function CborType(encode, decode) {
    this.encode = encode
    this.decode = decode
}

Object.setPrototypeOf(CborType.prototype, Pipeable.prototype)

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

    Object.setPrototypeOf(ConvertedType, inner)

    ConvertedType.prototype.encode = function encode(value, encoder, ctx) {
        return super.encode(toOldEncodedValue(value), encoder, ctx)
    }

    ConvertedType.prototype.decode = function decode(decoder, ctx) {
        return super.decode(decoder, ctx).map(toNewDecodedValue)
    }

    return new ConvertedType()
}