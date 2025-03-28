import { BYTES_TYPE } from "../../constants";
import { CborType } from "../cbor-type";
import { SliceDecoder, SliceEncoder } from "./slice";

export const bytes: CborType<SliceEncoder, SliceDecoder> = new CborType(
  new SliceEncoder(BYTES_TYPE),
  new SliceDecoder(BYTES_TYPE)
);
