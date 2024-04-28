export function getType(marker: number): number {
  return (marker >> 5) & 0xff;
}
