import { ok } from "resultra";
import { CborType } from "../base";
import { okNull } from "../okNull";

export const emptyType = new CborType<null, unknown, never, unknown, never>(
  () => okNull,
  () => ok(null),
);
