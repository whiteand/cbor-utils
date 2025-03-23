import { describe, expect, test } from "vitest";
import { Decoder } from "../Decoder";
import { Encoder } from "../Encoder";
import { fromHex, hex } from "../utils/hex";
import { CborType } from "./cbor-type";
import { stringifyErrorCode } from "./stringifyErrorCode";
import { IDecodable, IEncodable } from "./types";

export function testPositive<N, R extends number>(
  name: string,
  type: CborType<IEncodable<N, R>, IDecodable<N, R>>,
  TESTS: Array<{
    hex: string;
    decoded: N;
  }>
): void {
  describe(name, () => {
    test.each(TESTS)("decodes $hex => $decoded", (t) => {
      const d = new Decoder(new Uint8Array(fromHex(t.hex)), 0);
      expect(stringifyErrorCode(type.decoder().decode(d))).toBe("success");
      const value = type.decoder().getValue();
      expect(value).toStrictEqual(t.decoded);
      expect(d.ptr).toBe(d.buf.length);
    });
    test.each(TESTS)("decodes skips $hex", (t) => {
      const d = new Decoder(new Uint8Array(fromHex(t.hex)), 0);
      expect(stringifyErrorCode(type.decoder().skip(d))).toBe("success");
      expect(d.ptr).toBe(d.buf.length);
    });
    test.each(TESTS)("encodes $decoded => $hex", (t) => {
      const e = new Encoder();
      expect(stringifyErrorCode(type.encoder().encode(t.decoded, e))).toBe(
        "success"
      );
      expect(hex(e.finish())).toBe(t.hex);
    });
  });
}
