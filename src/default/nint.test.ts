import { nint } from "./nint";
import { Decoder } from "../Decoder";
import { Encoder } from "../Encoder";
import { describe, it, expect } from "vitest";
import { fromHex, hex } from "../utils/hex";
import { TypeMismatchError } from "../TypeMismatchError";
import { getEoiError } from "../EndOfInputError";
import { OverflowError } from "../OverflowError";
import { UnderflowError } from "../UnderflowError";
import { Z } from "../types";

describe("nint", () => {
  const tests = [
    { v: -1, b: "20" },
    { v: -0, ee: new OverflowError(-1, -0) },
    { v: 1, ee: new OverflowError(-1, 1) },
    { v: 1n, ee: new OverflowError(-1n, 1n) },
    {
      v: -(2n ** 128n),
      b: "3cffffffffffffffffffffffffffffffff",
    },
    {
      v: -(2n ** 128n) - 1n,
      ee: new UnderflowError(-(2n ** 128n), -(2n ** 128n) - 1n),
    },
    { v: "1", ee: new TypeMismatchError("number | bigint", "string") },
    { v: Infinity, ee: new TypeMismatchError("negative-int", "f64") },
    { v: -Infinity, ee: new TypeMismatchError("negative-int", "f64") },
    { b: "f97e00", de: new TypeMismatchError("negative-int", "f16") },
    { b: "", de: getEoiError() },
  ];

  const ty = nint;

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
