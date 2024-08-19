import { ok } from "resultra";
import { singleton } from "./singleton";

export const getVoidOk = singleton(() => Object.freeze(ok(undefined)));
