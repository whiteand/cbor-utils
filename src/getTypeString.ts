import { getType } from "./getType";

const TYPE_TO_STRING = ["number"];

export function getTypeString(marker: number): string {
  const ty = getType(marker);
  const str = TYPE_TO_STRING[ty];
  if (str == null) {
    throw new Error(`Unknown type of ${marker.toString(2).padStart(8, "0")}`);
  }
  return str;
}
