export function fromHex(hex: string): number[] {
  let i = 0;
  const n = hex.length;
  const bytes: number[] = [];
  while (i < n) {
    bytes.push(Number.parseInt(hex.slice(i, i + 2), 16));
    i += 2;
  }
  return bytes;
}

export function hex(arg0: Uint8Array): any {
  return [...arg0].map((e) => e.toString(16).padStart(2, "0")).join("");
}
