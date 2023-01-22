import { TypeResult, typeResultToStr } from "./Decoder";

export class TypeMismatchError extends Error {
  constructor(
    typeResult: TypeResult,
    position: number | null,
    message: string
  ) {
    const typeStr = typeResultToStr(typeResult);
    if (!message && position == null) {
      super(`unexpected type ${typeStr}`);
      return;
    }
    if (!message && position != null) {
      super(`unexpected type ${typeStr} at position ${position}`);
      return;
    }
    if (message && position == null) {
      super(`unexpected type ${typeStr}: ${message}`);
      return;
    }
    if (message && position != null) {
      super(`unexpected type ${typeStr} at position ${position}: ${message}`);
      return;
    }
  }
}
