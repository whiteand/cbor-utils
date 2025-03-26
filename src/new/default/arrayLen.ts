import { CborType } from "../cbor-type";
import { ARRAY_TYPE } from "../../constants";
import { LenDecoder, LenEncoder } from "./len";

export const arrayLen = new CborType(
  new LenEncoder(ARRAY_TYPE),
  new LenDecoder(ARRAY_TYPE)
);
