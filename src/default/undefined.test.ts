import { undefinedType } from "./undefined";
import { Decoder } from "../Decoder";
import { Encoder } from "../Encoder";
import { describe, it, expect } from "vitest";
import { fromHex, hex } from "../utils/hex";
import { TypeMismatchError } from "../TypeMismatchError";
import { getEoiError } from "../EndOfInputError";
import { UnexpectedValueError } from "../UnexpectedValueError";

describe("undefined", () => {
  const tests = [
    { v: undefined, b: "f7" },
    { v: "1", ee: new UnexpectedValueError(undefined, "1") },
    { b: "f97e00", de: new TypeMismatchError("undefined", "f16") },
    { b: "", de: getEoiError() },
  ];

  const ty = undefinedType;

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
      e.encode(ty, v as NotImportant).unwrap();
      expect(hex(e.finish())).toBe(b);
    }
  );
  it.each(tests.filter((e) => "v" in e && e.ee != null))(
    "fails to encode $v => $ee",
    ({ v, ee }) => {
      const e = new Encoder();
      const res = e.encode(ty, v as NotImportant);
      expect(!res.ok()).toBe(true);
      expect(!res.ok() && res.error).toEqual(ee);
    }
  );
});
