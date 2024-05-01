import { f32 } from "./f32";
import { Decoder } from "../Decoder";
import { Encoder } from "../Encoder";
import { describe, it, expect } from "vitest";
import { fromHex, hex } from "../utils/hex";
import { TypeMismatchError } from "../TypeMismatchError";
import { EOI_ERR } from "../EndOfInputError";

describe("f32", () => {
  const tests = [
    { v: 0, b: "fa00000000" },
    { v: -0, b: "fa80000000" },
    { v: NaN, b: "fa7fc00000" },
    { v: Infinity, b: "fa7f800000" },
    { v: -Infinity, b: "faff800000" },
    {
      v: 123,
      b: "fa42f60000",
    },
    { v: 1n, ee: new TypeMismatchError("number", "bigint") },
    { b: "f97e00", de: new TypeMismatchError("f32", "f16") },
    { b: "", de: EOI_ERR.error },
  ];

  const ty = f32;

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
    },
  );
  it.each(tests.filter((x) => "b" in x && x.ee == null && x.de != null))(
    "fails to decodes $b => $de",
    ({ b, de }) => {
      const decoder = new Decoder(new Uint8Array(fromHex(b || "")));
      const res = decoder.decode(ty);
      expect(res.ok()).toBe(false);
      expect(!res.ok() && res.error).toEqual(de);
    },
  );
  it.each(tests.filter((e) => e.ee == null && "v" in e))(
    "correctly encodes $v => $b",
    ({ v, b }) => {
      const e = new Encoder();
      e.encode(ty, v as any).unwrap();
      expect(hex(e.finish())).toBe(b);
    },
  );
  it.each(tests.filter((e) => "v" in e && e.ee != null))(
    "fails to encode $v => $ee",
    ({ v, ee }) => {
      const e = new Encoder();
      const res = e.encode(ty, v as any);
      expect(!res.ok()).toBe(true);
      expect(!res.ok() && res.error).toEqual(ee);
    },
  );
});
