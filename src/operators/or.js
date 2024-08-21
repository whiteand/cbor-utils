import { err } from "resultra";
import { CborType } from "../base";
import { BaseError } from "../BaseError";

class OrError extends BaseError {
  constructor(errors) {
    super(
      `failed or error: ${errors.map((e) => `"${e.message}"`).join(" & ")}`
    );
    this.errors = errors;
  }
}

export function or(...types) {
  const proto = CborType.builder()
    .encode(function encode(v, e, ctx) {
      const p = e.save();
      const errors = [];
      const { types } = this;
      for (const ty of types) {
        const res = ty.encode(v, e, ctx);
        if (res.ok()) {
          return res;
        } else {
          errors.push(res.error);
          e.restore(p);
        }
      }
      return err(new OrError(errors));
    })
    .decode(function decode(d, c) {
      const p = d.ptr;
      const errors = [];
      const { types } = this;
      for (const ty of types) {
        const res = ty.decode(d, c);
        if (res.ok()) {
          return res;
        } else {
          errors.push(res.error);
          d.ptr = p;
        }
      }
      return err(new OrError(errors));
    })
    .nullable(types.some((t) => t.nullable))
    .build();

  const orType = {
    types,
  };

  Reflect.setPrototypeOf(orType, proto);

  return orType;
}
