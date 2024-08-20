import { describe, expect, it } from "vitest";
import { u8 } from "./smallInts";
import { encode } from "../encode";
import { decode } from "../decode";
import { tuple } from "./tuple";

describe("arrayLen", () => {
  it("works", () => {
    const pairCbor = tuple([u8, u8]);
    expect(encode((e) => pairCbor.encode([42, 27], e))).toEqual(
      new Uint8Array([130, 24, 42, 24, 27])
    );
    const value = decode(new Uint8Array([130, 24, 42, 24, 27]), (d) =>
      pairCbor.decode(d)
    ).unwrap();

    expect(value).toEqual([42, 27]);
  });
});
