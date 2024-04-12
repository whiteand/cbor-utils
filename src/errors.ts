import { TypeResult, typeResultToStr } from "./Decoder";

export class DecodeRuntimeError extends Error {
  constructor(message: string, error: unknown) {
    super(`error during decode: ${message}`, {
      cause: error,
    });
  }
}

export class BufferOverflowError extends Error {
  constructor() {
    super("Buffer overflow");
  }
}

export class NotImplementedError<const M extends string> extends Error {
  constructor(public readonly methodPath: M) {
    super(`${methodPath} is not implemented yet`);
  }
}

export class EndOfInputError extends Error {
  constructor() {
    super("End of input");
  }
}

export class InvalidParams extends TypeError {
  constructor(message: string) {
    super(message);
  }
}

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
