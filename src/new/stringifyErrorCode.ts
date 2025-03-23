import {
  EOI_ERROR_CODE,
  INVALID_CBOR_ERROR_CODE,
  TYPE_MISMATCH_ERROR_CODE,
  OVERFLOW_ERROR_CODE,
  UNDERFLOW_ERROR_CODE,
} from "./error-codes";

/**
 *
 * The function returns the meaning of the code.
 *
 * USE ONLY FOR DEBUG PURPOSSES.
 *
 * @param code The error code
 * @returns string explanation
 */
export function stringifyErrorCode(code: number): string {
  switch (code) {
    case 0:
      return "success";
    case EOI_ERROR_CODE:
      return "end of input encountered";
    case INVALID_CBOR_ERROR_CODE:
      return "invalid CBOR encountered";
    case TYPE_MISMATCH_ERROR_CODE:
      return "Type mismatch happened";
    case OVERFLOW_ERROR_CODE:
      return "some value is larger than required";
    case UNDERFLOW_ERROR_CODE:
      return "some value is smaller than required";
    default:
      return `unknown error code: ${code}`;
  }
}
