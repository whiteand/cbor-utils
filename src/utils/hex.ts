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

export function hex(arg0: Uint8Array): any {
  return Buffer.from(arg0).toString("hex");
}
