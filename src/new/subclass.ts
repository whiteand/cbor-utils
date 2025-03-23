import { Z } from "../types";

export function childCtor<X extends object>(
  parent: X,
  name: string
): new () => X {
  const x = function () {};
  x.name = name;
  x.prototype = parent;
  const ctor = x as Z as new () => X;
  return ctor;
}
