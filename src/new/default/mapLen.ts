import { MAP_TYPE } from "../../constants";
import { CborType } from "../cbor-type";
import { MarkerDecoder, MarkerEncoder } from "./marker";

export const mapLen: CborType<MarkerEncoder, MarkerDecoder> = new CborType(
  new MarkerEncoder(MAP_TYPE),
  new MarkerDecoder(MAP_TYPE)
);
