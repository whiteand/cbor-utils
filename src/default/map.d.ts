import { EndOfInputError } from "../EndOfInputError";
import { InvalidCborError } from "../InvalidCborError";
import { OverflowError } from "../OverflowError";
import { CborType } from "../base";
import { ICborTypeCodec } from "../types";

/**
 * A function that can produce a `Map` type based on the key and value types.
 *
 * @param kt type of keys in the map
 * @param vt type of values in the map
 * @returns as CBOR type that encodes and decodes `Map<K, V>`
 */
declare function map<
  EK,
  EV,
  DK,
  DV,
  KEE extends Error,
  KDE extends Error,
  VEE extends Error,
  VDE extends Error,
  KEC,
  KDC,
  VEC,
  VDC
>(
  kt: ICborTypeCodec<EK, DK, KEE, KDE, KEC, KDC>,
  vt: ICborTypeCodec<EV, DV, VEE, VDE, VEC, VDC>
): CborType<
  Map<EK, EV>,
  Map<DK, DV>,
  KEE | VEE | OverflowError,
  KDE | VDE | InvalidCborError | EndOfInputError,
  KEC & VEC,
  KDC & VDC
>;
