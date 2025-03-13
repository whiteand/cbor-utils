import { describe, expect, it } from "vitest";
import { CborType } from "./base";
import { u8 } from "./default/smallInts";
import { UnexpectedValueError } from "./UnexpectedValueError";
import { Result, ok } from "resultra";
import { DecodingError } from "./DecodingError";
import { encode } from "./encode";
import { decode } from "./decode";
import { IDecoder, IEncoder } from "./types";

describe("base", () => {
  it("works", () => {
    const two = CborType.builder()
      .encode((_: 2, e: IEncoder) => u8.encode(2, e))
      .decode(
        (d: IDecoder): Result<2, UnexpectedValueError<number, 2> | DecodingError> => {
          const res = u8.decode(d);
          if (!res.ok()) return res;
          if (res.value !== 2)
            return new UnexpectedValueError(2, res.value).err();
          return ok(2);
        }
      )
      .nullable()
      .build();
    const encoded = encode((e: IEncoder) => two.encode(2, e));
    expect(encoded).toEqual(new Uint8Array([2]));
    const decoded = decode(encoded, (d: IDecoder) => two.decode(d)).unwrap();
    expect(decoded).toBe(2);
  });
});
