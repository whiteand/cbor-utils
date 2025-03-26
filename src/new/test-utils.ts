import { describe, expect, test } from "vitest";
import { Decoder } from "../Decoder";
import { Encoder } from "../Encoder";
import { fromHex, hex } from "../utils/hex";
import { CborType } from "./cbor-type";
import { stringifyErrorCode } from "./stringifyErrorCode";
import {
  InputByteStream,
  WithDecodeAndGetValue,
  WithEncodeMethod,
} from "./types";
import { free, provide, takeContext, useContext } from "./Context";
import { RemainingDataItemsContext } from "./remainingDataItems";
import { afterEach } from "node:test";

export function testCborType<N, ER extends number, DR extends number>(
  name: string,
  type: CborType<
    WithEncodeMethod<N, ER>,
    WithDecodeAndGetValue<N, DR> & { skip(d: InputByteStream): DR }
  >,
  POSITIVE_TESTS: Array<{
    hex: string;
    decoded: N;
    expectedRemaining?: number;
  }>,
  NEGATIVE_TESTS: Array<
    | {
        type: "encode";
        value: N;
        error: ER;
      }
    | {
        type: "decode";
        hex: string;
        error: DR;
      }
  >
): void {
  describe(name, () => {
    afterEach(() => {
      free(RemainingDataItemsContext);
    });
    test.each(POSITIVE_TESTS)("decodes $hex => $decoded", (t) => {
      const d = new Decoder(new Uint8Array(fromHex(t.hex)), 0);
      expect(stringifyErrorCode(type.decoder().decode(d))).toBe("success");
      const value = type.decoder().getValue();
      expect(value).toEqual(t.decoded);
      expect(d.ptr).toBe(d.buf.length);
    });
    test.each(POSITIVE_TESTS)(
      "decodes $hex => $decoded with remaining data items",
      (t) => {
        provide(RemainingDataItemsContext, 1);
        const d = new Decoder(new Uint8Array(fromHex(t.hex)), 0);
        expect(stringifyErrorCode(type.decoder().decode(d))).toBe("success");
        const remainingDataItems = takeContext(RemainingDataItemsContext);
        const value = type.decoder().getValue();
        expect(value).toEqual(t.decoded);
        expect(d.ptr).toBe(d.buf.length);
        expect(remainingDataItems).toBe(t.expectedRemaining ?? 0);
      }
    );
    test.each(POSITIVE_TESTS)("decodes skips $hex", (t) => {
      const d = new Decoder(new Uint8Array(fromHex(t.hex)), 0);
      expect(stringifyErrorCode(type.decoder().skip(d))).toBe("success");
      expect(d.ptr).toBe(d.buf.length);
    });
    test.each(POSITIVE_TESTS)("encodes $decoded => $hex", (t) => {
      const e = new Encoder();
      expect(stringifyErrorCode(type.encoder().encode(t.decoded, e))).toBe(
        "success"
      );
      expect(hex(e.finish())).toBe(t.hex);
    });
    test.each(NEGATIVE_TESTS.filter((x) => x.type === "encode"))(
      "fails to encode $value, error: $error",
      (t) => {
        const e = new Encoder();
        const res = type.encoder().encode(t.value, e);
        expect(res).not.toBe(0);
        expect(stringifyErrorCode(res)).toBe(stringifyErrorCode(t.error));
      }
    );
    test.each(NEGATIVE_TESTS.filter((x) => x.type === "decode"))(
      "fails to decode from $hex, error: $error",
      (t) => {
        const d = new Decoder(new Uint8Array(fromHex(t.hex)), 0);
        const res = type.decoder().decode(d);
        expect(res).not.toBe(0);
        expect(stringifyErrorCode(res)).toBe(stringifyErrorCode(t.error));
      }
    );
  });
}
