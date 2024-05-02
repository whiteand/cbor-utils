import { Result, ok } from "resultra";

export const success = Object.freeze(ok<void>(undefined)) as Result<
  void,
  never
>;
