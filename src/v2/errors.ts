import { BaseError } from "./BaseError";

export class NotImplementedError extends BaseError {
  constructor(functionName: string) {
    super(functionName + " not implemented");
  }
}
export class NotNullableError extends BaseError {
  constructor() {
    super("Not nullable");
  }
}
