import { CborType } from "../base";
import { okNull } from "../okNull";

const doNothingResult = () => okNull;

export const unit = new CborType<null, unknown, never, unknown, never>(
  doNothingResult,
  doNothingResult,
);
