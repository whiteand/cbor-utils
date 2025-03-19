export function getType(marker: number): number {
  return (marker >> 5) & 0b111;
}

export function getInfo(marker: number): number {
  return marker & 0x1f;
}
