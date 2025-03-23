import { testPositive } from "../test-utils";
import { u16, u32, u64, u8, uint } from "./uint";

testPositive("uint", uint, [
  {
    hex: "00",
    decoded: 0,
  },
  {
    hex: "01",
    decoded: 1,
  },
  {
    hex: "0a",
    decoded: 10,
  },
  {
    hex: "17",
    decoded: 23,
  },
  {
    hex: "1818",
    decoded: 24,
  },
  {
    hex: "1819",
    decoded: 25,
  },
  {
    hex: "1864",
    decoded: 100,
  },
  {
    hex: "1903e8",
    decoded: 1000,
  },
  {
    hex: "1a000f4240",
    decoded: 1000000,
  },
  { decoded: 2n ** 64n - 1n, hex: "1bffffffffffffffff" },
]);

testPositive("u8", u8, [
  { decoded: 0, hex: "00" },
  { decoded: 1, hex: "01" },
  { decoded: 0xff, hex: "18ff" },
]);

testPositive("u16", u16, [
  { decoded: 0, hex: "00" },
  { decoded: 1, hex: "01" },
  { decoded: 0xff, hex: "18ff" },
  { decoded: 0xffff, hex: "19ffff" },
]);

testPositive("u32", u32, [
  { decoded: 0, hex: "00" },
  { decoded: 1, hex: "01" },
  { decoded: 0xff, hex: "18ff" },
  { decoded: 0xffff, hex: "19ffff" },
  { decoded: 2147483647, hex: "1a7fffffff" },
  { decoded: 2147483648, hex: "1a80000000" },
  { decoded: 0xffffffff, hex: "1affffffff" },
]);

testPositive("u64", u64, [
  { decoded: 0n, hex: "00" },
  { decoded: 1n, hex: "01" },
  { decoded: 0xffn, hex: "18ff" },
  { decoded: 0xffffn, hex: "19ffff" },
  { decoded: 2147483647n, hex: "1a7fffffff" },
  { decoded: 2147483648n, hex: "1a80000000" },
  { decoded: 0xffffffffn, hex: "1affffffff" },
  { decoded: 0xffffffffffffffffn, hex: "1bffffffffffffffff" },
]);
