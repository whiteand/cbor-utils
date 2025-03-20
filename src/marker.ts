/**
 * Returns the major type of the data item based on it's first byte(the marker).
 *
 * @param marker the first byte of the data item in a CBOR encoded byte stream
 * @returns the type of the data item (the highest 3 bits of the marker)
 */
export function getType(marker: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  return ((marker >> 5) & 0b111) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

/**
 * NOTE: It is highly improbable that you would want to use this function.
 * It is exported just to  provided low level control for those who need it.
 *
 * @param marker the first byte of the data item in a CBOR encoded byte stream
 * @returns the additional info stored in the byte (the last 5 bits)
 */
export function getInfo(marker: number): number {
  return marker & 0x1f;
}
