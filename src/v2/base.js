import { err } from "resultra";
import { NotImplementedError } from "./errors";

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

CborType.builder = function () {
    return new CborBuilder()
}