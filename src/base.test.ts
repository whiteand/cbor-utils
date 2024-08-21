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
    const two = CborType.builder()
      .encode((value: 2, e) => u8.encode(2, e))
      .decode(
        (d): Result<2, UnexpectedValueError<number, 2> | DecodingError> => {
          const res = u8.decode(d);
          if (!res.ok()) return res;
          if (res.value !== 2)
            return new UnexpectedValueError(2, res.value).err();
          return ok(2);
        }
      )
      .nullable()
      .build();
    console.log("here");
    const encoded = encode((e) => two.encode(2, e));
    console.log("here 2");
    expect(encoded).toEqual(new Uint8Array([2]));
    console.log("here 3");
    const decoded = decode(encoded, (d) => two.decode(d)).unwrap();
    console.log("here 4");
    expect(decoded).toBe(2);
  });
});
