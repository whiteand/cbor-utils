import { OkResult, Result, err, ok } from "resultra";
import { DataItem, TaggedDataItem } from "./DataItem";
import { EOF_ERR, EndOfInputError } from "./EndOfInputError";
import { InvalidCborError } from "./InvalidCborError";
import { TypeMismatchError } from "./TypeMismatchError";
import { getTypeString } from "./getTypeString";

export type DecodingError =
  | EndOfInputError
  | InvalidCborError
  | TypeMismatchError;

type TDecoder<V extends DataItem> = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
) => Result<V, DecodingError>;

function decodeIntLess24(
  _bytes: Uint8Array,
  _offset: number,
  marker: number,
): OkResult<number> {
  return ok(marker & 0x1f);
}

function decodeUint8(
  bytes: Uint8Array,
  offset: number,
): Result<number, DecodingError> {
  if (offset + 1 >= bytes.length) return EOF_ERR;
  let nextByte = bytes[offset + 1];
  return ok(nextByte);
}
function decodeUint16(
  bytes: Uint8Array,
  offset: number,
): Result<number, DecodingError> {
  if (offset + 2 >= bytes.length) return EOF_ERR;
  let ptr = offset + 1;
  let a = bytes[ptr++];
  let b = bytes[ptr++];
  return ok((a << 8) | b);
}
function decodeUint32(
  bytes: Uint8Array,
  offset: number,
): Result<number, DecodingError> {
  if (offset + 4 >= bytes.length) return EOF_ERR;
  let ptr = offset + 1;
  let a = bytes[ptr++];
  let b = bytes[ptr++];
  let c = bytes[ptr++];
  let d = bytes[ptr++];
  return ok((a << 24) | (b << 16) | (c << 8) | d);
}
function decodeUint64(
  bytes: Uint8Array,
  offset: number,
): Result<bigint, DecodingError> {
  if (offset + 8 >= bytes.length) return EOF_ERR;
  let ptr = offset + 1;
  let res = BigInt(bytes[ptr++]);
  res <<= 8n;
  res |= BigInt(bytes[ptr++]);
  res <<= 8n;
  res |= BigInt(bytes[ptr++]);
  res <<= 8n;
  res |= BigInt(bytes[ptr++]);
  res <<= 8n;
  res |= BigInt(bytes[ptr++]);
  res <<= 8n;
  res |= BigInt(bytes[ptr++]);
  res <<= 8n;
  res |= BigInt(bytes[ptr++]);
  res <<= 8n;
  res |= BigInt(bytes[ptr++]);
  return ok(res);
}

const vTable: TDecoder<DataItem>[] = [];
const invalidCbor = (marker: number) =>
  function (_b: Uint8Array, offset: number): Result<never, InvalidCborError> {
    return new InvalidCborError(marker, offset).err();
  };

for (let i = 0; i < 256; i++) {
  vTable.push(invalidCbor(i));
}

for (let i = 0; i < 24; i++) {
  vTable[i] = decodeIntLess24;
}
vTable[24] = decodeUint8;
vTable[25] = decodeUint16;
vTable[26] = decodeUint32;
vTable[27] = decodeUint64;
vTable[28] = invalidCbor(28);
vTable[29] = invalidCbor(29);
vTable[30] = invalidCbor(30);

const predefinedTagsDecoders = new Map<number | bigint, TDecoder<DataItem>>();

predefinedTagsDecoders.set(2, decodeBigNum);

function decodeTaggedItem(
  bytes: Uint8Array,
  offset: number,
  marker: number,
  tag: bigint | number,
): Result<DataItem, DecodingError> {
  const itemDecoder = predefinedTagsDecoders.get(tag);
  if (itemDecoder == null) {
    const res = decodeItem(bytes, offset);
    if (!res.ok()) return res;
    return ok(new TaggedDataItem(tag, res.value));
  }
  return itemDecoder(bytes, offset, bytes[offset]);
}

function decodeSmallIntTagDataItem(
  bytes: Uint8Array,
  offset: number,
  marker: number,
): Result<DataItem> {
  const tag = marker & 0x1f;
  if (offset + 1 >= bytes.length) return EOF_ERR;
  return decodeTaggedItem(bytes, offset + 1, bytes[offset + 1], tag);
}

function decodeBigNum(
  bytes: Uint8Array,
  offset: number,
): Result<bigint, DecodingError> {
  let item = decodeItem(bytes, offset);
  if (!item.ok()) return item;
  if (!(item.value instanceof Uint8Array)) {
    return err(new TypeMismatchError("bytes", getTypeString(bytes[offset])));
  }
  let res = 0n;
  for (let i = 0, n = item.value.length; i < n; i++) {
    res <<= 8n;
    res |= BigInt(item.value[i]);
  }
  return ok(res);
}

for (let i = 0; i < 24; i++) {
  vTable[i | (0b110 << 5)] = decodeSmallIntTagDataItem;
}

export function decodeItem(
  bytes: Uint8Array,
  offset: number,
): Result<DataItem, DecodingError> {
  if (offset >= bytes.length) {
    return EOF_ERR;
  }
  let ptr = offset;
  let marker = bytes[ptr++];
  const decoder = vTable[marker];
  if (!decoder) {
    const type = marker >> 5;
    const value = marker & 0x1f;
    throw new Error(
      `Cannot decode type: ${type
        .toString(2)
        .padStart(
          3,
          "0",
        )} with value=${value}. Input: ${Buffer.from(bytes).toString("hex")}`,
    );
  }
  return decoder(bytes, offset, marker);
}
