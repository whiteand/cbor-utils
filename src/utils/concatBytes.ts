export function concatBytesOfLength(
  chunks: Uint8Array[],
  totalLength: number
): Uint8Array {
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
