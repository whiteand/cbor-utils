import { bytes } from "./bytes";
import { u8 } from "./smallInts";
import { seq } from "./seq";
import { Decoder } from "../Decoder";
import { Encoder } from "../Encoder";
import { describe, it, expect } from "vitest";
import { fromHex, hex } from "../utils/hex";
import { TypeMismatchError } from "../TypeMismatchError";
import { EOI_ERR } from "../EndOfInputError";

describe("seq", () => {
  const tests = [
    { v: [0, 0], b: "0000" },
    { v: [0, 0, 1], ee: new TypeMismatchError("array[2]", "array[3]") },
    { v: 1, ee: new TypeMismatchError("array[2]", "Number") },
    { b: "00a0", de: new TypeMismatchError("uint", "map") },
    { b: "00", de: EOI_ERR.error },
    { b: "", de: EOI_ERR.error },
  ];

  const ty = seq([u8, u8]);

  it.each(tests.filter((x) => "b" in x && x.ee == null && x.de == null))(
    "correctly decodes $b => $v",
    ({ v, b }) => {
      const decoder = new Decoder(new Uint8Array(fromHex(b || "")));
      const res = decoder.decode(ty).unwrap();
      if (Number.isNaN(v)) {
        expect(res).toBeNaN();
      } else {
        expect(res).toEqual(v);
      }
    }
  );
  it.each(tests.filter((x) => "b" in x && x.ee == null && x.de != null))(
    "fails to decodes $b => $de",
    ({ b, de }) => {
      const decoder = new Decoder(new Uint8Array(fromHex(b || "")));
      const res = decoder.decode(ty);
      expect(res.ok()).toBe(false);
      expect(!res.ok() && res.error).toEqual(de);
    }
  );
  it.each(tests.filter((e) => e.ee == null && "v" in e))(
    "correctly encodes $v => $b",
    ({ v, b }) => {
      const e = new Encoder();
      e.encode(ty, v as any).unwrap();
      expect(hex(e.finish())).toBe(b);
    }
  );
  it.each(tests.filter((e) => "v" in e && e.ee != null))(
    "fails to encode $v => $ee",
    ({ v, ee }) => {
      const e = new Encoder();
      const res = e.encode(ty, v as any);
      expect(!res.ok()).toBe(true);
      expect(!res.ok() && res.error).toEqual(ee);
    }
  );
});
