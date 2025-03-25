/** End of input encountered */
export const EOI_ERROR_CODE = 1 as 1 & { readonly EOI_ERROR_CODE?: true };

/** Invalid CBOR encountered */
export const INVALID_CBOR_ERROR_CODE = 2 as 2 & {
  readonly INVALID_CBOR_ERROR_CODE?: true;
};

/** Typemismatch happened */
export const TYPE_MISMATCH_ERROR_CODE = 3 as 3 & {
  readonly TYPE_MISMATCH_ERROR_CODE?: true;
};

/** Some value was overflown */
export const OVERFLOW_ERROR_CODE = 4 as 4 & {
  readonly OVERFLOW_ERROR_CODE?: true;
};

/** Some value is smaller than the required minimum value */
export const UNDERFLOW_ERROR_CODE = 5 as 5 & {
  readonly UNDERFLOW_ERROR_CODE?: true;
};
