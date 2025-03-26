import { describe, expect, test } from "vitest";
import { fromUtf8, utf8 } from "./utf8";

const TEST_STRINGS: [string, number[]][] = [
  [" ", [32]],
  ["udx", [117, 100, 120]],
  ["udx\u1232", [117, 100, 120, 225, 136, 178]],
  ["\u0091", [194, 145]],
  ["𐐷", [240, 144, 144, 183]],
  ["", []],
];

describe("utf8", () => {
  test.each(TEST_STRINGS)(
    "utf(%j) => %j",
    (str: string, expected: number[]) => {
      expect(utf8(str)).toEqual(expected);
    }
  );
});

describe("fromUtf8", () => {
  test.each(TEST_STRINGS)("fromUtf %j %j", (str, expected) => {
    const receiver = { value: "" };
    const result = fromUtf8(expected, receiver);
    expect(result).toBe(0);
    expect(receiver.value).toBe(str);
  });
});
