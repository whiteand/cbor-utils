export function fromHex(hex: string): number[] {
  let i = 0;
  let n = hex.length;
  let bytes: number[] = [];
  while (i < n) {
    bytes.push(Number.parseInt(hex.slice(i, i + 2), 16));
    i += 2;
  }
  return bytes;
}
