import { ok } from "resultra";
import { CborType } from "../base";
import { success } from "../success";

/**
 * A CBOR type that does nothing on encode and decodes `null`
 */
export const emptyType = new CborType<null, never, never, unknown, unknown>(
  () => success,
  () => ok(null)
);
