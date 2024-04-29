export function getType(marker: number): number {
  return (marker >> 5) & 0xff;
}

export function getInfo(marker: number): number {
  return marker & 0x1f;
}
