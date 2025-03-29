export function takeSuffix<T>(start: number, arr: T[]): T[] {
  return arr.splice(start, arr.length - start);
}
