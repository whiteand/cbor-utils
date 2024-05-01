export function getJsType(v: unknown) {
  return Object.prototype.toString.call(v).slice("[object ".length, -1);
}
