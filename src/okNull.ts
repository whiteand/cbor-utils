import { Result, ok } from "resultra";

export const okNull = Object.freeze(ok(null)) as Result<null, never>;
