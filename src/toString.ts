export function toString(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (Number.isNaN(value)) return "NaN";
  if (typeof value !== "object") {
    if (typeof value.toString === "function") return value.toString();
  }
  return JSON.stringify(value);
}
