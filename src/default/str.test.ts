import { describe, expect, it } from "vitest";
import { Decoder } from "../Decoder";
import { Encoder } from "../Encoder";
import { getEoiError } from "../EndOfInputError";
import { TypeMismatchError } from "../TypeMismatchError";
import { fromHex, hex } from "../utils/hex";
import { str } from "./str";
import { Z } from "../types";

describe("str", () => {
  const tests = [
    { v: "", b: "60" },
    {
      v: "123",
      b: "63313233",
    },
    { v: 1, ee: new TypeMismatchError("string", "number") },
    { b: "f97e00", de: new TypeMismatchError("str", "f16") },
    { b: "", de: getEoiError() },
  ];

  const ty = str;

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
      e.encode(ty, v as Z).unwrap();
      expect(hex(e.finish())).toBe(b);
    }
  );
  it.each(tests.filter((e) => "v" in e && e.ee != null))(
    "fails to encode $v => $ee",
    ({ v, ee }) => {
      const e = new Encoder();
      const res = e.encode(ty, v as Z);
      expect(!res.ok()).toBe(true);
      expect(!res.ok() && res.error).toEqual(ee);
    }
  );
});
