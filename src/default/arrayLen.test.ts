import { describe, expect, it } from "vitest";
import { u8 } from "./smallInts";
import { encode } from "../encode";
import { decode } from "../decode";
import { tuple } from "./tuple";
import { IDecoder, IEncoder } from "../types";

describe("arrayLen", () => {
  it("works", () => {
    const pairCbor = tuple([u8, u8]);
    expect(encode((e: IEncoder) => pairCbor.encode([42, 27], e))).toEqual(
      new Uint8Array([130, 24, 42, 24, 27])
    );
    const value = decode(new Uint8Array([130, 24, 42, 24, 27]), (d: IDecoder) =>
      pairCbor.decode(d)
    ).unwrap();

    expect(value).toEqual([42, 27]);
  });
});
