import { CborType } from "../cbor-type";
import { ARRAY_TYPE } from "../../constants";
import { MarkerDecoder, MarkerEncoder } from "./marker";

export const arrayLen: CborType<MarkerEncoder, MarkerDecoder> = new CborType(
  new MarkerEncoder(ARRAY_TYPE),
  new MarkerDecoder(ARRAY_TYPE)
);
