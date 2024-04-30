import { OkResult, Result, err, ok } from "resultra";
import { DataItem, Simple, TaggedDataItem } from "./DataItem";
import { EOI_ERR } from "./EndOfInputError";
import { concatBytesOfLength } from "./utils/concatBytes";
import { InvalidCborError } from "./InvalidCborError";
import { TypeMismatchError } from "./TypeMismatchError";
import { getTypeString } from "./getTypeString";
import { getType } from "./marker";
import { Metadata } from "./Metadata";
import {
  ARRAY_TYPE_MASK,
  BYTES_TYPE_MASK,
  MAP_TYPE_MASK,
  NEGATIVE_INT_TYPE_MASK,
  NUMBER_TYPE_MASK,
  SPECIAL_TYPE_MASK,
  STRING_TYPE_MASK,
  TAG_TYPE_MASK,
} from "./constants";
import { fromUtf8 } from "./utils/utf8";
import { DecodingError } from "./DecodingError";

type TDecoder<V extends DataItem> = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
) => Result<V, DecodingError>;

function decodeIntLess24(
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): OkResult<number> {
  metadata.setTypeFromMarker(marker).setNext(offset + 1);
  return ok(marker & 0x1f);
}

function decodeUint8(
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): Result<number, DecodingError> {
  metadata.setTypeFromMarker(marker);
  if (offset + 1 >= bytes.length) return EOI_ERR;
  let nextByte = bytes[offset + 1];
  metadata.setNext(offset + 2);
  return ok(nextByte);
}
function decodeUint16(
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): Result<number, DecodingError> {
  metadata.setTypeFromMarker(marker);
  if (offset + 2 >= bytes.length) return EOI_ERR;
  let ptr = offset + 1;
  let a = bytes[ptr++];
  let b = bytes[ptr++];
  metadata.setNext(ptr);
  return ok((a << 8) | b);
}
function decodeUint32(
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): Result<number, DecodingError> {
  metadata.setTypeFromMarker(marker);
  if (offset + 4 >= bytes.length) return EOI_ERR;
  let ptr = offset + 1;
  let a = bytes[ptr++];
  let b = bytes[ptr++];
  let c = bytes[ptr++];
  let d = bytes[ptr++];
  metadata.setNext(ptr);
  return ok((a << 24) | (b << 16) | (c << 8) | d);
}
function decodeUint64(
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): Result<bigint, DecodingError> {
  metadata.setTypeFromMarker(marker);
  if (offset + 8 >= bytes.length) return EOI_ERR;
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
  metadata.setNext(ptr);
  return ok(res);
}

const vTable: TDecoder<DataItem>[] = [];
const invalidCbor = (marker: number) =>
  function (
    _bytes: Uint8Array,
    offset: number,
    marker: number,
    metadata: Metadata,
  ): Result<never, InvalidCborError> {
    metadata.setTypeFromMarker(marker);
    return new InvalidCborError(marker, offset).err();
  };

// for (let i = 0; i < 256; i++) {
//   vTable.push(invalidCbor(i));
// }

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

function decodeTaggedItem(
  bytes: Uint8Array,
  offset: number,
  marker: number,
  tag: number | bigint,
  metadata: Metadata,
): Result<DataItem, DecodingError> {
  const res = decodeItem(bytes, offset, metadata);
  if (!res.ok()) return res;

  return ok(new TaggedDataItem(tag, res.value));
}

function decodeSmallIntTagDataItem(
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): Result<DataItem, DecodingError> {
  const ty = getType(marker);
  const tag = marker & 0x1f;
  if (offset + 1 >= bytes.length) return EOI_ERR;

  const res = decodeTaggedItem(
    bytes,
    offset + 1,
    bytes[offset + 1],
    tag,
    metadata,
  );
  metadata.setType(ty);
  return res;
}

function decodeBigNum(
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): Result<bigint, DecodingError> {
  const ty = getType(marker);
  let item = decodeItem(bytes, offset, metadata);
  if (!item.ok()) {
    return item;
  }
  const innerTy = metadata.getType();
  if (innerTy !== BYTES_TYPE_MASK >> 5) {
    return err(new TypeMismatchError("bytes", getTypeString(innerTy)));
  }
  const bignumBytes = item.value as Uint8Array;
  let res = 0n;
  for (let i = 0, n = bignumBytes.length; i < n; i++) {
    res <<= 8n;
    res |= BigInt(bignumBytes[i]);
  }

  metadata.setType(ty);

  return ok(res);
}

for (let i = 0; i < 24; i++) {
  vTable[TAG_TYPE_MASK | i] = decodeSmallIntTagDataItem;
}
// DATE_TIME in standard format 2013-03-21T20:04:00Z
vTable[TAG_TYPE_MASK | 0] = (bytes, offset, marker, metadata) => {
  const t = getType(marker);
  if (offset + 2 >= bytes.length) return EOI_ERR;
  let ptr = offset + 1;
  const itemMarker = bytes[ptr++];
  const itemType = getType(itemMarker);
  if (itemType === STRING_TYPE_MASK >> 5) {
    const res = decodeItem(bytes, offset + 1, metadata);
    metadata.setType(t);
    return res;
  }
  return err(
    new TypeMismatchError("date-time string", getTypeString(itemMarker)),
  );
};
// DATE_TIME in unix time
vTable[TAG_TYPE_MASK | 1] = (bytes, offset, marker, metadata) => {
  const t = getType(marker);
  if (offset + 2 >= bytes.length) return EOI_ERR;
  let ptr = offset + 1;
  const itemMarker = bytes[ptr++];
  const itemType = getType(itemMarker);
  const itemInfo = 0x1f & itemMarker;
  if (
    itemType === NUMBER_TYPE_MASK >> 5 ||
    itemType === NEGATIVE_INT_TYPE_MASK >> 5 ||
    (itemType === SPECIAL_TYPE_MASK >> 5 &&
      (itemInfo === 25 || itemInfo === 26 || itemInfo === 27))
  ) {
    const res = decodeItem(bytes, offset + 1, metadata);
    metadata.setType(t);
    return res;
  }
  return err(
    new TypeMismatchError("Epoch-based date time", getTypeString(itemMarker)),
  );
};
// Predefined bignum tag
vTable[TAG_TYPE_MASK | 2] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
) => {
  metadata.setTypeFromMarker(marker);
  return offset + 1 >= bytes.length
    ? EOI_ERR
    : decodeBigNum(bytes, offset + 1, bytes[offset + 1], metadata);
};

vTable[TAG_TYPE_MASK | 3] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): Result<bigint, DecodingError> => {
  metadata.setTypeFromMarker(marker);
  return offset + 1 >= bytes.length
    ? EOI_ERR
    : decodeBigNum(bytes, offset + 1, bytes[offset + 1], metadata).map(
        (r) => -1n - r,
      );
};

// Table 5: Tag Numbers Defined in RFC 7049
// Tag	Data Item	Semantics
// 0	text string	Standard date/time string; see Section 3.4.1
// 1	integer or float	Epoch-based date/time; see Section 3.4.2
// 2	byte string	Unsigned bignum; see Section 3.4.3
// 3	byte string	Negative bignum; see Section 3.4.3
// 4	array	Decimal fraction; see Section 3.4.4
// 5	array	Bigfloat; see Section 3.4.4
// 21	(any)	Expected conversion to base64url encoding; see Section 3.4.5.2
// 22	(any)	Expected conversion to base64 encoding; see Section 3.4.5.2
// 23	(any)	Expected conversion to base16 encoding; see Section 3.4.5.2
// 24	byte string	Encoded CBOR data item; see Section 3.4.5.1
// 32	text string	URI; see Section 3.4.5.3
// 33	text string	base64url; see Section 3.4.5.3
// 34	text string	base64; see Section 3.4.5.3
// 36	text string	MIME message; see Section 3.4.5.3
// 55799	(any)	Self-described CBOR; see Section 3.4.6
vTable[TAG_TYPE_MASK | 24] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): Result<DataItem, DecodingError> => {
  const t = getType(marker);
  if (offset + 1 >= bytes.length) return EOI_ERR;
  const tag = bytes[offset + 1];
  switch (tag) {
    case 24: {
      if (offset + 2 >= bytes.length) return EOI_ERR;
      const nextByte = bytes[offset + 2];
      if (getType(nextByte) !== BYTES_TYPE_MASK >> 5) {
        return err(
          new TypeMismatchError("cbor-bytes", getTypeString(nextByte)),
        );
      }
      const item = decodeItem(bytes, offset + 2, metadata) as Result<
        Uint8Array,
        DecodingError
      >;
      metadata.setType(t);
      if (!item.ok()) {
        return item;
      }
      return item;
    }
    // 32: URI
    // 33: base64url
    // 34: base64
    // 36: MIME_MESSAGE
    case 32:
    case 33:
    case 34: {
      if (offset + 2 >= bytes.length) return EOI_ERR;
      const nextByte = bytes[offset + 2];
      if (getType(nextByte) !== STRING_TYPE_MASK >> 5) {
        return err(new TypeMismatchError("string", getTypeString(nextByte)));
      }
      const item = decodeItem(bytes, offset + 2, metadata) as Result<
        string,
        DecodingError
      >;
      metadata.setType(t);
      if (!item.ok()) {
        return item;
      }
      return item;
    }
    default: {
      return decodeTaggedItem(
        bytes,
        offset + 2,
        bytes[offset + 2],
        tag,
        metadata,
      );
    }
  }
};

for (let len = 0; len < 24; len++) {
  vTable[BYTES_TYPE_MASK | len] = (
    bytes: Uint8Array,
    offset: number,
    marker: number,
    metadata: Metadata,
  ) => {
    metadata.setType(BYTES_TYPE_MASK >> 5);
    if (offset + len >= bytes.length) return EOI_ERR;
    metadata.setNext(offset + len + 1);
    return ok(bytes.slice(offset + 1, offset + len + 1));
  };
}

vTable[BYTES_TYPE_MASK | 31] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
) => {
  const t = getType(marker);
  metadata.setNext(offset + 1);
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (metadata.next < bytes.length) {
    if (bytes[metadata.next] === 0xff) {
      metadata.setType(t).setNext(metadata.next + 1);
      break;
    }
    const itemType = getType(bytes[metadata.next]);
    if (itemType !== BYTES_TYPE_MASK >> 5) {
      return err(
        new TypeMismatchError("bytes", getTypeString(bytes[metadata.next])),
      );
    }
    const chunk = decodeItem(bytes, metadata.next, metadata) as Result<
      Uint8Array,
      DecodingError
    >;
    if (!chunk.ok()) {
      metadata.setType(t);
      return chunk;
    }
    totalLength += chunk.value.length;
    chunks.push(chunk.value);
  }

  return ok(concatBytesOfLength(chunks, totalLength));
};

for (let i = 0; i < 24; i++) {
  vTable[NEGATIVE_INT_TYPE_MASK | i] = (
    bytes: Uint8Array,
    offset: number,
    marker: number,
    metadata: Metadata,
  ) => {
    metadata.setTypeFromMarker(marker).setNext(offset + 1);
    return ok(-1 - i);
  };
}
vTable[NEGATIVE_INT_TYPE_MASK | 24] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
) => {
  metadata.setType(NEGATIVE_INT_TYPE_MASK >> 5);

  if (offset + 1 >= bytes.length) return EOI_ERR;
  metadata.setNext(offset + 2);
  return ok(-1 - bytes[offset + 1]);
};
vTable[NEGATIVE_INT_TYPE_MASK | 25] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): Result<number, DecodingError> => {
  metadata.setType(NEGATIVE_INT_TYPE_MASK >> 5);
  let ptr = offset + 1;
  if (ptr >= bytes.length) return EOI_ERR;
  let res = bytes[ptr++];
  res <<= 8;
  res |= bytes[ptr++];
  metadata.setNext(ptr);
  return ok(-1 - res);
};
vTable[NEGATIVE_INT_TYPE_MASK | 26] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): Result<number, DecodingError> => {
  metadata.setType(NEGATIVE_INT_TYPE_MASK >> 5);
  let ptr = offset + 1;
  if (ptr >= bytes.length) return EOI_ERR;
  let res = bytes[ptr++];
  res <<= 8;
  res |= bytes[ptr++];
  res <<= 8;
  res |= bytes[ptr++];
  res <<= 8;
  res |= bytes[ptr++];
  metadata.setNext(ptr);
  return ok(-1 - res);
};
vTable[NEGATIVE_INT_TYPE_MASK | 27] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): Result<bigint, DecodingError> => {
  metadata.setType(NEGATIVE_INT_TYPE_MASK >> 5);
  let ptr = offset + 1;
  if (ptr >= bytes.length) return EOI_ERR;
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
  metadata.setNext(ptr);
  return ok(-1n - res);
};

function decodeHalfFloat(
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
) {
  metadata.setTypeFromMarker(marker);
  if (offset + 2 >= bytes.length) {
    return EOI_ERR;
  }
  let a = bytes[offset + 1];
  let b = bytes[offset + 2];

  metadata.setNext(offset + 3);

  const pos = a >> 7 === 0;
  const exponent = (a & 0b1111100) >> 2;
  const significand = ((a & 0b11) << 8) | b;

  if (exponent === 0) {
    if (significand === 0) {
      return ok(pos ? 0 : -0);
    } else {
      return ok((pos ? 1 : -1) * 2 ** -14 * (significand / 1024));
    }
  }
  if (exponent === 31) {
    if (significand === 0) {
      return ok(pos ? Infinity : -Infinity);
    } else {
      return ok(NaN);
    }
  }
  let res = 2 ** (exponent - 15) * (1 + significand / 1024);
  return ok(pos ? res : -res);
}
function decodeFloat32(
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
) {
  metadata.setTypeFromMarker(marker);
  if (offset + 4 >= bytes.length) {
    return EOI_ERR;
  }
  const dataView = new DataView(bytes.buffer, bytes.byteOffset + offset + 1);
  const res = dataView.getFloat32(0, false);
  metadata.setNext(offset + 5);
  return ok(res);
}
function decodeFloat64(
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
) {
  metadata.setTypeFromMarker(marker);
  if (offset + 8 >= bytes.length) {
    return EOI_ERR;
  }
  const dataView = new DataView(bytes.buffer, bytes.byteOffset + offset + 1);
  const res = dataView.getFloat64(0, false);
  metadata.setNext(offset + 9);
  return ok(res);
}
function constant<T extends DataItem>(value: T): TDecoder<T> {
  return (_bytes, offset, marker, metadata) => {
    metadata.setTypeFromMarker(marker).setNext(offset + 1);
    return ok(value);
  };
}

function smallSimple<const T extends number>(value: T): TDecoder<Simple<T>> {
  return (_bytes, offset, marker, metadata) => {
    metadata.setTypeFromMarker(marker).setNext(offset + 1);
    return ok(new Simple(value));
  };
}

for (let i = 0; i < 20; i++) {
  vTable[SPECIAL_TYPE_MASK | i] = smallSimple(i);
}
vTable[SPECIAL_TYPE_MASK | 20] = constant(false);
vTable[SPECIAL_TYPE_MASK | 21] = constant(true);
vTable[SPECIAL_TYPE_MASK | 22] = constant(null);
vTable[SPECIAL_TYPE_MASK | 23] = constant(undefined);
vTable[SPECIAL_TYPE_MASK | 24] = (bytes, offset, marker, metadata) => {
  if (offset + 1 >= bytes.length) return EOI_ERR;
  const value = bytes[offset + 1];
  metadata.setTypeFromMarker(marker).setNext(offset + 2);
  return ok(new Simple(value));
};
vTable[SPECIAL_TYPE_MASK | 25] = decodeHalfFloat;
vTable[SPECIAL_TYPE_MASK | 26] = decodeFloat32;
vTable[SPECIAL_TYPE_MASK | 27] = decodeFloat64;

function decodeMapU32Len(
  bytes: Uint8Array,
  offset: number,
  metadata: Metadata,
  len: number,
) {
  const res = new Map();
  metadata.setNext(offset);
  for (let i = 0; i < len; i++) {
    let keyItem = decodeItem(bytes, metadata.next, metadata);
    if (!keyItem.ok()) {
      return keyItem;
    }
    let valueItem = decodeItem(bytes, metadata.next, metadata);
    if (!valueItem.ok()) {
      return valueItem;
    }
    res.set(keyItem.value, valueItem.value);
  }
  return ok(res);
}
function decodeMapU64Len(
  bytes: Uint8Array,
  offset: number,
  metadata: Metadata,
  len: bigint,
) {
  const res = new Map();
  metadata.setNext(offset);
  for (let i = 0n; i < len; i += 1n) {
    let keyItem = decodeItem(bytes, metadata.next, metadata);
    if (!keyItem.ok()) {
      return keyItem;
    }
    let valueItem = decodeItem(bytes, metadata.next, metadata);
    if (!valueItem.ok()) {
      return valueItem;
    }
    res.set(keyItem.value, valueItem.value);
  }
  return ok(res);
}

vTable[MAP_TYPE_MASK | 0] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
) => {
  metadata.setTypeFromMarker(marker).setNext(offset + 1);
  return ok(new Map());
};
for (let len = 1; len < 24; len++) {
  vTable[MAP_TYPE_MASK | len] = (
    bytes: Uint8Array,
    offset: number,
    marker: number,
    metadata: Metadata,
  ): Result<Map<DataItem, DataItem>, DecodingError> => {
    const t = getType(marker);
    metadata.setTypeFromMarker(marker);
    if (offset + 1 >= bytes.length) return EOI_ERR;
    const res = decodeMapU32Len(bytes, offset + 1, metadata, len);
    metadata.setType(t);
    return res;
  };
}
vTable[MAP_TYPE_MASK | 24] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): Result<Map<DataItem, DataItem>, DecodingError> => {
  const t = getType(marker);
  metadata.setTypeFromMarker(marker);
  if (offset + 2 >= bytes.length) return EOI_ERR;

  const len = bytes[offset + 1];
  const res = decodeMapU32Len(bytes, offset + 1, metadata, len);
  metadata.setType(t);
  return res;
};
vTable[MAP_TYPE_MASK | 25] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): Result<Map<DataItem, DataItem>, DecodingError> => {
  const t = getType(marker);
  metadata.setTypeFromMarker(marker);
  if (offset + 3 >= bytes.length) return EOI_ERR;

  let ptr = offset + 1;
  let len = bytes[ptr++];
  len <<= 8;
  len |= bytes[ptr++];

  const res = decodeMapU32Len(bytes, ptr, metadata, len);
  metadata.setType(t);
  return res;
};
vTable[MAP_TYPE_MASK | 26] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): Result<Map<DataItem, DataItem>, DecodingError> => {
  const t = getType(marker);
  metadata.setTypeFromMarker(marker);
  if (offset + 5 >= bytes.length) return EOI_ERR;

  let ptr = offset + 1;
  let len = bytes[ptr++];
  len <<= 8;
  len |= bytes[ptr++];
  len <<= 8;
  len |= bytes[ptr++];
  len <<= 8;
  len |= bytes[ptr++];

  const res = decodeMapU32Len(bytes, ptr, metadata, len);
  metadata.setType(t);
  return res;
};
vTable[MAP_TYPE_MASK | 27] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): Result<Map<DataItem, DataItem>, DecodingError> => {
  const t = getType(marker);
  metadata.setTypeFromMarker(marker);
  if (offset + 9 >= bytes.length) return EOI_ERR;

  let ptr = offset + 1;
  let len = BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);

  const res = decodeMapU64Len(bytes, ptr, metadata, len);
  metadata.setType(t);
  return res;
};
vTable[MAP_TYPE_MASK | 28] = invalidCbor(MAP_TYPE_MASK | 28);
vTable[MAP_TYPE_MASK | 29] = invalidCbor(MAP_TYPE_MASK | 29);
vTable[MAP_TYPE_MASK | 30] = invalidCbor(MAP_TYPE_MASK | 30);
vTable[MAP_TYPE_MASK | 31] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
): Result<Map<DataItem, DataItem>, DecodingError> => {
  const t = getType(marker);
  metadata.setTypeFromMarker(marker);
  metadata.setNext(offset + 1);
  const n = bytes.length;
  const res = new Map();
  while (metadata.next < n) {
    let keyMarker = bytes[metadata.next];
    if (keyMarker === 0xff) {
      metadata.setNext(metadata.next + 1).setType(t);
      break;
    }
    const keyItem = decodeItem(bytes, metadata.next, metadata);
    if (!keyItem.ok()) {
      return keyItem;
    }
    const valueItem = decodeItem(bytes, metadata.next, metadata);
    if (!valueItem.ok()) {
      return valueItem;
    }
    res.set(keyItem.value, valueItem.value);
  }
  return ok(res);
};

function decodeStringU32Len(
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
  len: number,
): Result<string, DecodingError> {
  if (offset + len > bytes.length) {
    return EOI_ERR;
  }
  let slice = bytes.subarray(offset, offset + len);
  let str = fromUtf8(slice);
  if (!str.ok()) {
    return new InvalidCborError(marker, offset, str.error).err();
  }
  metadata.setNext(offset + len);
  return str;
}
function decodeStringU64Len(
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
  len: bigint,
) {
  if (BigInt(offset) + len > BigInt(bytes.length)) {
    return EOI_ERR;
  }
  let slice = bytes.subarray(offset, offset + Number(len));
  let str = fromUtf8(slice);
  if (!str.ok()) {
    return new InvalidCborError(marker, offset, str.error).err();
  }
  metadata.setNext(offset + Number(len));
  return str;
}

for (let i = 0; i < 24; i++) {
  vTable[STRING_TYPE_MASK | i] = (
    bytes: Uint8Array,
    offset: number,
    marker: number,
    metadata: Metadata,
  ) => {
    metadata.setTypeFromMarker(marker).setNext(offset + 1);
    return decodeStringU32Len(bytes, offset + 1, marker, metadata, i);
  };
}
vTable[STRING_TYPE_MASK | 24] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
) => {
  metadata.setTypeFromMarker(marker);
  if (offset + 1 >= bytes.length) return EOI_ERR;
  let len = bytes[offset + 1];
  return decodeStringU32Len(bytes, offset + 2, marker, metadata, len);
};
vTable[STRING_TYPE_MASK | 25] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
) => {
  metadata.setTypeFromMarker(marker);
  if (offset + 2 >= bytes.length) return EOI_ERR;
  let ptr = offset + 1;
  let len = bytes[ptr++];
  len <<= 8;
  len |= bytes[ptr++];
  return decodeStringU32Len(bytes, ptr, marker, metadata, len);
};
vTable[STRING_TYPE_MASK | 26] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
) => {
  metadata.setTypeFromMarker(marker);
  if (offset + 4 >= bytes.length) return EOI_ERR;
  let ptr = offset + 1;
  let len = bytes[ptr++];
  len <<= 8;
  len |= bytes[ptr++];
  len <<= 8;
  len |= bytes[ptr++];
  len <<= 8;
  len |= bytes[ptr++];
  return decodeStringU32Len(bytes, ptr, marker, metadata, len);
};
vTable[STRING_TYPE_MASK | 27] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
) => {
  metadata.setTypeFromMarker(marker);
  if (offset + 8 >= bytes.length) return EOI_ERR;
  let ptr = offset + 1;
  let len = BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  return decodeStringU64Len(bytes, ptr, marker, metadata, len);
};
vTable[STRING_TYPE_MASK | 31] = (
  bytes: Uint8Array,
  offset: number,
  marker: number,
  metadata: Metadata,
) => {
  const t = getType(marker);
  metadata.setNext(offset + 1);
  const chunks: string[] = [];
  while (metadata.next < bytes.length) {
    let chunkMarker = bytes[metadata.next];
    if (chunkMarker === 0xff) {
      metadata.setNext(metadata.next + 1).setType(t);
      break;
    }
    const chunkType = getType(chunkMarker);
    if (chunkType !== STRING_TYPE_MASK >> 5) {
      return err(new TypeMismatchError("string", getTypeString(chunkMarker)));
    }
    const item = decodeItem(bytes, metadata.next, metadata) as Result<
      string,
      DecodingError
    >;
    if (!item.ok()) {
      metadata.setType(t);
      return item;
    }
    chunks.push(item.value);
  }
  return ok(chunks.join(""));
};

function decodeArrayU32Len(
  bytes: Uint8Array,
  offset: number,
  len: number,
  metadata: Metadata,
) {
  metadata.next = offset;
  const res: DataItem[] = [];
  for (let i = 0; i < len; i++) {
    let item = decodeItem(bytes, metadata.next, metadata);
    if (!item.ok()) {
      return item;
    }
    res.push(item.value);
  }
  return ok(res);
}
function decodeArrayU64Len(
  bytes: Uint8Array,
  offset: number,
  len: bigint,
  metadata: Metadata,
) {
  metadata.next = offset;
  const res: DataItem[] = [];
  for (let i = 0n; i < len; i += 1n) {
    let item = decodeItem(bytes, metadata.next, metadata);
    if (!item.ok()) {
      return item;
    }
    res.push(item.value);
  }
  return ok(res);
}

for (let i = 0; i < 24; i++) {
  vTable[ARRAY_TYPE_MASK | i] = (bytes, offset, marker, metadata) => {
    const t = getType(marker);
    const res = decodeArrayU32Len(bytes, offset + 1, i, metadata);
    metadata.setType(t);
    if (!res.ok()) {
      return res;
    }
    return res;
  };
}
vTable[ARRAY_TYPE_MASK | 24] = (bytes, offset, marker, metadata) => {
  const t = getType(marker);
  let ptr = offset + 1;
  let len = bytes[ptr++];
  const res = decodeArrayU32Len(bytes, ptr, len, metadata);
  metadata.setType(t);
  if (!res.ok()) {
    return res;
  }
  return res;
};
vTable[ARRAY_TYPE_MASK | 25] = (bytes, offset, marker, metadata) => {
  const t = getType(marker);
  let ptr = offset + 1;
  let len = bytes[ptr++];
  len <<= 8;
  len |= bytes[ptr++];
  const res = decodeArrayU32Len(bytes, ptr, len, metadata);
  metadata.setType(t);
  if (!res.ok()) {
    return res;
  }
  return res;
};
vTable[ARRAY_TYPE_MASK | 26] = (bytes, offset, marker, metadata) => {
  const t = getType(marker);
  let ptr = offset + 1;
  let len = bytes[ptr++];
  len <<= 8;
  len |= bytes[ptr++];
  len <<= 8;
  len |= bytes[ptr++];
  len <<= 8;
  len |= bytes[ptr++];
  const res = decodeArrayU32Len(bytes, ptr, len, metadata);
  metadata.setType(t);
  if (!res.ok()) {
    return res;
  }
  return res;
};
vTable[ARRAY_TYPE_MASK | 27] = (bytes, offset, marker, metadata) => {
  const t = getType(marker);
  let ptr = offset + 1;
  let len = BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  len <<= 8n;
  len |= BigInt(bytes[ptr++]);
  const res = decodeArrayU64Len(bytes, ptr, len, metadata);
  metadata.setType(t);
  if (!res.ok()) {
    return res;
  }
  return res;
};

vTable[ARRAY_TYPE_MASK | 31] = (bytes, offset, marker, metadata) => {
  const t = getType(marker);
  metadata.setNext(offset + 1);
  const res: DataItem[] = [];
  while (metadata.next < bytes.length) {
    const itemMarker = bytes[metadata.next];
    if (itemMarker === 0xff) {
      metadata.setNext(metadata.next + 1).setType(t);
      break;
    }
    const item = decodeItem(bytes, metadata.next, metadata);
    if (!item.ok()) {
      return item;
    }
    res.push(item.value);
  }
  return ok(res);
};

export function decodeItem(
  bytes: Uint8Array,
  offset: number,
  metadata: Metadata = new Metadata(),
): Result<DataItem, DecodingError> {
  if (offset >= bytes.length) {
    return EOI_ERR;
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
        .padStart(3, "0")} with value=${value}. Input: ${Buffer.from(
        bytes,
      ).toString("hex")}`,
    );
  }
  return decoder(bytes, offset, marker, metadata);
}
