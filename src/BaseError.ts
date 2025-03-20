import { ErrResult, err } from "resultra";

/** Base class for errors in this library
 *
 * it just extends standard Error class with err method
 */
export class BaseError extends Error {
  /**
   * The same as Error constructor
   *
   * @param message Error message
   * @param options Error options
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
  /**
   * Wraps the error into ErrResult
   *
   * @returns Error result with this error used as an error
   */
  err(): ErrResult<this> {
    return err(this);
  }
}
