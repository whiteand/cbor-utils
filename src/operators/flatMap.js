import { CborType } from "../base";

export const flatMap = (newEncode, newDecode, nullable) => (ty) => {
  const sourceType = CborType.from(ty);
  const proto = CborType.builder()
    .encode(function encode(value, e, ctx) {
      const innerValueRes = this.newEncode(value, ctx);
      if (!innerValueRes.ok()) {
        return innerValueRes;
      }

      const innerValue = innerValueRes.value;

      return this.sourceType.encode(innerValue, e, ctx);
    })
    .decode(function decode(d, ctx) {
      const startPosition = d.ptr;
      const inner = this.sourceType.decode(d, ctx);
      return inner.ok()
        ? this.newDecode(inner.value, d, ctx, startPosition)
        : inner;
    })
    .nullable(nullable ?? sourceType.nullable)
    .build();

  const obj = {
    newEncode,
    newDecode,
    sourceType,
  };

  Reflect.setPrototypeOf(obj, proto);

  return obj;
};
