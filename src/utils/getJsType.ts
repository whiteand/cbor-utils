export function getJsType(v: unknown): string {
  return Object.prototype.toString.call(v).slice("[object ".length, -1);
}
