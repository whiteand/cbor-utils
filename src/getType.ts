export function getType(marker: number): number {
  return (marker >> 5) & 255;
}
