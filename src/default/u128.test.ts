import { u128 } from "./bigInts";
import { Decoder } from "../Decoder";
import { Encoder } from "../Encoder";
import { describe, it, expect } from "vitest";
import { fromHex, hex } from "../utils/hex";
import { OverflowError } from "../OverflowError";
import { TypeMismatchError } from "../TypeMismatchError";
import { getEoiError } from "../EndOfInputError";
import { NotImportant } from "../types";

describe("u128", () => {
  const tests = [
    { v: 0n, b: "00" },
    { v: 2n ** 128n - 1n, b: "1cffffffffffffffffffffffffffffffff" },
    { v: 2n ** 128n, ee: new OverflowError(2n ** 128n - 1n, 2n ** 128n) },
    { b: "f97e00", de: new TypeMismatchError("uint", "f16") },
    { b: "", de: getEoiError() },
  ];

  it.each(tests.filter((x) => "b" in x && x.ee == null && x.de == null))(
    "correctly decodes $b => $v",
    ({ v, b }) => {
      const decoder = new Decoder(new Uint8Array(fromHex(b || "")));
      const res = decoder.decode(u128).unwrap();
      if (Number.isNaN(v)) {
        expect(res).toBeNaN();
      } else {
        expect(res).toBe(v);
      }
    }
  );
  it.each(tests.filter((x) => "b" in x && x.ee == null && x.de != null))(
    "fails to decodes $b => $de",
    ({ b, de }) => {
      const decoder = new Decoder(new Uint8Array(fromHex(b || "")));
      const res = decoder.decode(u128);
      expect(res.ok()).toBe(false);
      expect(!res.ok() && res.error).toEqual(de);
    }
  );
  it.each(tests.filter((e) => e.ee == null && "v" in e))(
    "correctly encodes $v => $b",
    ({ v, b }) => {
      const e = new Encoder();
      e.encode(u128, v as NotImportant).unwrap();
      expect(hex(e.finish())).toBe(b);
    }
  );
  it.each(tests.filter((e) => "v" in e && e.ee != null))(
    "fails to encode $v => $ee",
    ({ v, ee }) => {
      const e = new Encoder();
      const res = e.encode(u128, v as NotImportant);
      expect(!res.ok()).toBe(true);
      expect(!res.ok() && res.error).toEqual(ee);
    }
  );
});
