import { ok } from "resultra";
import { CborType } from "../base";
import { getVoidOk } from "../getVoidOk";

/**
 * A CBOR type that does nothing on encode and decodes `null`
 */
export const emptyType: CborType<unknown, null, never, Error, unknown, unknown> = CborType.builder()
  .encode(getVoidOk)
  .decode(() => ok(null))
  .build();
