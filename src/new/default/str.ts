import { STRING_TYPE } from "../../constants";
import { fromUtf8, utf8 } from "../utf8";
import { CborType } from "../cbor-type";
import { SliceDecoder, SliceEncoder } from "./slice";
import { INVALID_CBOR_ERROR_CODE } from "../error-codes";

export const str = new CborType(
  new SliceEncoder(STRING_TYPE).map((v: string) => new Uint8Array(utf8(v))),
  new SliceDecoder(STRING_TYPE).tryMap(
    (bs, receiver: { value: string }) => {
      const res = fromUtf8(bs, receiver);
      return res === 0 ? 0 : INVALID_CBOR_ERROR_CODE;
    },
    () => ""
  )
);
