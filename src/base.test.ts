import { describe, expect, it } from "vitest";
import { CborType } from "./base";
import { u8 } from "./default/smallInts";
import { UnexpectedValueError } from "./UnexpectedValueError";
import { Result, ok } from "resultra";
import { DecodingError } from "./DecodingError";
import { encode } from "./encode";
import { decode } from "./decode";

describe("base", () => {
  it("works", () => {
    const two = CborType.from(
      (value: 2, e) => u8.encode(2, e),
      (d): Result<2, UnexpectedValueError<number, 2> | DecodingError> => {
        const res = u8.decode(d);
        if (!res.ok()) return res;
        if (res.value !== 2)
          return new UnexpectedValueError(2, res.value).err();
        return ok(2);
      }
    );
    const encoded = encode((e) => two.encode(2, e));
    expect(encoded).toEqual(new Uint8Array([2]));
    const decoded = decode(encoded, (d) => two.decode(d)).unwrap();
    expect(decoded).toBe(2);
  });
});
