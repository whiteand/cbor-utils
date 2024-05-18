import { Result, ok } from "resultra";
import { TypeMismatchError } from "../TypeMismatchError";
import { flatMap } from "../operators/flatMap";
import { tagged } from "../operators/tagged";
import { TaggedDataItem } from "./DataItem";
import { bytes } from "./bytes";
import { UnexpectedValueError } from "../UnexpectedValueError";
import { OverflowError } from "../OverflowError";
import { DecodingError } from "../DecodingError";
import { CborType } from "../base";

function bigintFromBe(be: Uint8Array) {
  let res = 0n;
  for (let i = 0, n = be.length; i < n; i++) {
    res = (res << 8n) | BigInt(be[i]);
  }
  return res;
}
function bigintToBe(b: bigint) {
  const res: number[] = [];
  while (b > 0) {
    const chunk = b & 0xffn;
    res.push(Number(chunk));
    b >>= 8n;
  }
  res.reverse();
  if (res.length <= 0) {
    res.push(0);
  }
  return new Uint8Array(res);
}

/**
 * A CBOR type that encodes any kind of bigint as a tagged item.
 */
export const bignum: CborType<
  bigint,
  TypeMismatchError | OverflowError,
  DecodingError | UnexpectedValueError<string, string>,
  unknown,
  unknown
> = bytes.pipe(
  tagged(),
  flatMap(
    (v: bigint): Result<TaggedDataItem<Uint8Array>, TypeMismatchError> => {
      if (typeof v !== "bigint")
        return new TypeMismatchError("bigint", typeof v).err();
      return ok(
        new TaggedDataItem(v >= 0n ? 2 : 3, bigintToBe(v >= 0n ? v : -1n - v))
      );
    },
    (t: TaggedDataItem<Uint8Array>) => {
      const tag = Number(t.tag);

      switch (tag) {
        case 2:
          return ok(bigintFromBe(t.value));
        case 3:
          return ok(-1n - bigintFromBe(t.value));
        default:
          return new UnexpectedValueError("2 | 3", `${tag}`).err();
      }
    }
  )
);
