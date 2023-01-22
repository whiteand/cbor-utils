export function beBytesToU16(slice: Uint8Array) {
  return (slice[0] << 8) | slice[1];
}
export function beBytesToU32(s: Uint8Array) {
  return (s[0] << 24) | (s[1] << 16) | (s[2] << 8) | s[3];
}
export function beBytesToU64(s: Uint8Array) {
  let res = 0n;
  for (let i = 0; i < 8; i++) {
    res = (res << 8n) | BigInt(s[i]);
  }
  return res;
}

export function u16ToBeBytes(x: number): Uint8Array {
  const res = new Uint8Array(2);
  res[0] = (x >> 8) & 0xff;
  res[1] = x & 0xff;
  return res;
}
export function u32ToBeBytes(x: number): Uint8Array {
  const res = new Uint8Array(4);
  for (let i = 0, p = 3; i < 4; i++, p--) {
    res[p] = x & 0xff;
    x = x >> 8;
  }
  return res;
}
export function u64ToBytes(x: bigint) {
  const res = new Uint8Array(8);
  for (let i = 0, p = 7; i < 8; i++, p--) {
    res[p] = Number(x & 0xffn);
    x = x >> 8n;
  }
  return res;
}
