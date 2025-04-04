import { Simple } from "./DataItem";
import { TaggedDataItem } from "./TaggedDataItem";
import { describe, expect, test } from "vitest";
import { fromHex } from "../utils/hex";
import { any } from "./any";
import { Decoder } from "../Decoder";
import { skip } from "../skip";
import { Z } from "../types";

export const TESTS: Array<{
  cbor: string;
  hex: string;
  roundtrip?: boolean;
  decoded?: unknown;
  diagnostic?: string;
}> = [
  {
    cbor: "AA==",
    hex: "00",
    roundtrip: true,
    decoded: 0,
  },
  {
    cbor: "AQ==",
    hex: "01",
    roundtrip: true,
    decoded: 1,
  },
  {
    cbor: "Cg==",
    hex: "0a",
    roundtrip: true,
    decoded: 10,
  },
  {
    cbor: "Fw==",
    hex: "17",
    roundtrip: true,
    decoded: 23,
  },
  {
    cbor: "GBg=",
    hex: "1818",
    roundtrip: true,
    decoded: 24,
  },
  {
    cbor: "GBk=",
    hex: "1819",
    roundtrip: true,
    decoded: 25,
  },
  {
    cbor: "GGQ=",
    hex: "1864",
    roundtrip: true,
    decoded: 100,
  },
  {
    cbor: "GQPo",
    hex: "1903e8",
    roundtrip: true,
    decoded: 1000,
  },
  {
    cbor: "GgAPQkA=",
    hex: "1a000f4240",
    roundtrip: true,
    decoded: 1000000,
  },
  {
    cbor: "GwAAAOjUpRAA",
    hex: "1b000000e8d4a51000",
    roundtrip: true,
    decoded: 1000000000000n,
  },
  {
    cbor: "G///////////",
    hex: "1bffffffffffffffff",
    roundtrip: true,
    decoded: 18446744073709551615n,
  },
  {
    cbor: "wkkBAAAAAAAAAAA=",
    hex: "c249010000000000000000",
    roundtrip: true,
    decoded: 18446744073709551616n,
  },
  {
    cbor: "O///////////",
    hex: "3bffffffffffffffff",
    roundtrip: true,
    decoded: -18446744073709551616n,
  },
  {
    cbor: "w0kBAAAAAAAAAAA=",
    hex: "c349010000000000000000",
    roundtrip: true,
    decoded: -18446744073709551617n,
  },
  {
    cbor: "IA==",
    hex: "20",
    roundtrip: true,
    decoded: -1,
  },
  {
    cbor: "KQ==",
    hex: "29",
    roundtrip: true,
    decoded: -10,
  },
  {
    cbor: "OGM=",
    hex: "3863",
    roundtrip: true,
    decoded: -100,
  },
  {
    cbor: "OQPn",
    hex: "3903e7",
    roundtrip: true,
    decoded: -1000,
  },
  {
    cbor: "+QAA",
    hex: "f90000",
    roundtrip: true,
    decoded: 0.0,
  },
  {
    cbor: "+YAA",
    hex: "f98000",
    roundtrip: true,
    decoded: -0.0,
  },
  {
    cbor: "+TwA",
    hex: "f93c00",
    roundtrip: true,
    decoded: 1.0,
  },
  {
    cbor: "+z/xmZmZmZma",
    hex: "fb3ff199999999999a",
    roundtrip: true,
    decoded: 1.1,
  },
  {
    cbor: "+T4A",
    hex: "f93e00",
    roundtrip: true,
    decoded: 1.5,
  },
  {
    cbor: "+Xv/",
    hex: "f97bff",
    roundtrip: true,
    decoded: 65504.0,
  },
  {
    cbor: "+kfDUAA=",
    hex: "fa47c35000",
    roundtrip: true,
    decoded: 100000.0,
  },
  {
    cbor: "+n9///8=",
    hex: "fa7f7fffff",
    roundtrip: true,
    decoded: 3.4028234663852886e38,
  },
  {
    cbor: "+3435DyIAHWc",
    hex: "fb7e37e43c8800759c",
    roundtrip: true,
    decoded: 1.0e300,
  },
  {
    cbor: "+QAB",
    hex: "f90001",
    roundtrip: true,
    decoded: Number.parseFloat("5.960464477539063e-8"),
  },
  {
    cbor: "+QQA",
    hex: "f90400",
    roundtrip: true,
    decoded: 6.103515625e-5,
  },
  {
    cbor: "+cQA",
    hex: "f9c400",
    roundtrip: true,
    decoded: -4.0,
  },
  {
    cbor: "+8AQZmZmZmZm",
    hex: "fbc010666666666666",
    roundtrip: true,
    decoded: -4.1,
  },
  {
    cbor: "+XwA",
    hex: "f97c00",
    roundtrip: true,
    decoded: Infinity,
    diagnostic: "Infinity",
  },
  {
    cbor: "+X4A",
    hex: "f97e00",
    roundtrip: true,
    decoded: NaN,
    diagnostic: "NaN",
  },
  {
    cbor: "",
    hex: "A10102",
    decoded: new Map([[1, 2]]),
  },
  {
    cbor: "",
    hex: "B818000001010A0A0B0B0C0C0D0D0E0E0F0F1010111112121313020214141515161617170303040405050606070708080909",
    decoded: new Map(Array.from({ length: 24 }, (_, i) => [i, i])),
  },
  {
    cbor: "+fwA",
    hex: "f9fc00",
    roundtrip: true,
    decoded: -Infinity,
    diagnostic: "-Infinity",
  },
  {
    cbor: "+n+AAAA=",
    hex: "fa7f800000",
    roundtrip: false,
    decoded: Infinity,
    diagnostic: "Infinity",
  },
  {
    cbor: "+n/AAAA=",
    hex: "fa7fc00000",
    roundtrip: false,
    decoded: NaN,
    diagnostic: "NaN",
  },
  {
    cbor: "+v+AAAA=",
    hex: "faff800000",
    roundtrip: false,
    decoded: -Infinity,
    diagnostic: "-Infinity",
  },
  {
    cbor: "+3/wAAAAAAAA",
    hex: "fb7ff0000000000000",
    roundtrip: false,
    decoded: Infinity,
    diagnostic: "Infinity",
  },
  {
    cbor: "+3/4AAAAAAAA",
    hex: "fb7ff8000000000000",
    roundtrip: false,
    decoded: NaN,
    diagnostic: "NaN",
  },
  {
    cbor: "+//wAAAAAAAA",
    hex: "fbfff0000000000000",
    roundtrip: false,
    decoded: -Infinity,
    diagnostic: "-Infinity",
  },
  {
    cbor: "9A==",
    hex: "f4",
    roundtrip: true,
    decoded: false,
  },
  {
    cbor: "9Q==",
    hex: "f5",
    roundtrip: true,
    decoded: true,
  },
  {
    cbor: "9g==",
    hex: "f6",
    roundtrip: true,
    decoded: null,
  },
  {
    cbor: "9w==",
    hex: "f7",
    roundtrip: true,
    diagnostic: "undefined",
  },
  {
    cbor: "8A==",
    hex: "f0",
    roundtrip: true,
    decoded: Simple.of(16),
    diagnostic: "simple(16)",
  },
  {
    cbor: "+Bg=",
    hex: "f818",
    roundtrip: true,
    decoded: Simple.of(24),
    diagnostic: "simple(24)",
  },
  {
    cbor: "+P8=",
    hex: "f8ff",
    roundtrip: true,
    decoded: Simple.of(255),
    diagnostic: "simple(255)",
  },
  {
    cbor: "wHQyMDEzLTAzLTIxVDIwOjA0OjAwWg==",
    hex: "c074323031332d30332d32315432303a30343a30305a",
    roundtrip: true,
    decoded: "2013-03-21T20:04:00Z",
    diagnostic: '0("2013-03-21T20:04:00Z")',
  },
  {
    cbor: "wRpRS2ew",
    hex: "c11a514b67b0",
    roundtrip: true,
    decoded: 1363896240,
    diagnostic: "1(1363896240)",
  },
  {
    cbor: "wftB1FLZ7CAAAA==",
    hex: "c1fb41d452d9ec200000",
    roundtrip: true,
    decoded: 1363896240.5,
    diagnostic: "1(1363896240.5)",
  },
  {
    cbor: "10QBAgME",
    hex: "d74401020304",
    roundtrip: true,
    decoded: new TaggedDataItem(23, new Uint8Array([1, 2, 3, 4])),
    diagnostic: "23(h'01020304')",
  },
  {
    cbor: "2BhFZElFVEY=",
    hex: "d818456449455446",
    roundtrip: true,
    decoded: new Uint8Array(fromHex("6449455446")),
    diagnostic: "24(h'6449455446')",
  },
  {
    cbor: "2CB2aHR0cDovL3d3dy5leGFtcGxlLmNvbQ==",
    hex: "d82076687474703a2f2f7777772e6578616d706c652e636f6d",
    roundtrip: true,
    decoded: "http://www.example.com",
    diagnostic: '32("http://www.example.com")',
  },
  {
    cbor: "QA==",
    hex: "40",
    roundtrip: true,
    decoded: new Uint8Array(0),
    diagnostic: "h''",
  },
  {
    cbor: "RAECAwQ=",
    hex: "4401020304",
    roundtrip: true,
    decoded: new Uint8Array(fromHex("01020304")),
    diagnostic: "h'01020304'",
  },
  {
    cbor: "YA==",
    hex: "60",
    roundtrip: true,
    decoded: "",
  },
  {
    cbor: "YWE=",
    hex: "6161",
    roundtrip: true,
    decoded: "a",
  },
  {
    cbor: "ZElFVEY=",
    hex: "6449455446",
    roundtrip: true,
    decoded: "IETF",
  },
  {
    cbor: "YiJc",
    hex: "62225c",
    roundtrip: true,
    decoded: '"\\',
  },
  {
    cbor: "YsO8",
    hex: "62c3bc",
    roundtrip: true,
    decoded: "ü",
  },
  {
    cbor: "Y+awtA==",
    hex: "63e6b0b4",
    roundtrip: true,
    decoded: "水",
  },
  {
    cbor: "ZPCQhZE=",
    hex: "64f0908591",
    roundtrip: true,
    decoded: "𐅑",
  },
  {
    cbor: "gA==",
    hex: "80",
    roundtrip: true,
    decoded: [],
  },
  {
    cbor: "gwECAw==",
    hex: "83010203",
    roundtrip: true,
    decoded: [1, 2, 3],
  },
  {
    cbor: "gwGCAgOCBAU=",
    hex: "8301820203820405",
    roundtrip: true,
    decoded: [1, [2, 3], [4, 5]],
  },
  {
    cbor: "mBkBAgMEBQYHCAkKCwwNDg8QERITFBUWFxgYGBk=",
    hex: "98190102030405060708090a0b0c0d0e0f101112131415161718181819",
    roundtrip: true,
    decoded: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25,
    ],
  },
  {
    cbor: "oA==",
    hex: "a0",
    roundtrip: true,
    decoded: new Map(),
  },
  {
    cbor: "ogECAwQ=",
    hex: "a201020304",
    roundtrip: true,
    decoded: new Map([
      [1, 2],
      [3, 4],
    ]),
    diagnostic: "{1: 2, 3: 4}",
  },
  {
    cbor: "omFhAWFiggID",
    hex: "a26161016162820203",
    roundtrip: true,
    decoded: new Map<string, Z>([
      ["a", 1],
      ["b", [2, 3]],
    ]),
  },
  {
    cbor: "gmFhoWFiYWM=",
    hex: "826161a161626163",
    roundtrip: true,
    decoded: ["a", new Map([["b", "c"]])],
  },
  {
    cbor: "pWFhYUFhYmFCYWNhQ2FkYURhZWFF",
    hex: "a56161614161626142616361436164614461656145",
    roundtrip: true,
    decoded: new Map(
      Object.entries({
        a: "A",
        b: "B",
        c: "C",
        d: "D",
        e: "E",
      })
    ),
  },
  {
    cbor: "X0IBAkMDBAX/",
    hex: "5f42010243030405ff",
    roundtrip: false,
    decoded: new Uint8Array([1, 2, 3, 4, 5]),
    diagnostic: "(_ h'0102', h'030405')",
  },
  {
    cbor: "f2VzdHJlYWRtaW5n/w==",
    hex: "7f657374726561646d696e67ff",
    roundtrip: false,
    decoded: "streaming",
  },
  {
    cbor: "n/8=",
    hex: "9fff",
    roundtrip: false,
    decoded: [],
  },
  {
    cbor: "nwGCAgOfBAX//w==",
    hex: "9f018202039f0405ffff",
    roundtrip: false,
    decoded: [1, [2, 3], [4, 5]],
  },
  {
    cbor: "nwGCAgOCBAX/",
    hex: "9f01820203820405ff",
    roundtrip: false,
    decoded: [1, [2, 3], [4, 5]],
  },
  {
    cbor: "gwGCAgOfBAX/",
    hex: "83018202039f0405ff",
    roundtrip: false,
    decoded: [1, [2, 3], [4, 5]],
  },
  {
    cbor: "gwGfAgP/ggQF",
    hex: "83019f0203ff820405",
    roundtrip: false,
    decoded: [1, [2, 3], [4, 5]],
  },
  {
    cbor: "nwECAwQFBgcICQoLDA0ODxAREhMUFRYXGBgYGf8=",
    hex: "9f0102030405060708090a0b0c0d0e0f101112131415161718181819ff",
    roundtrip: false,
    decoded: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25,
    ],
  },
  {
    cbor: "v2FhAWFinwID//8=",
    hex: "bf61610161629f0203ffff",
    roundtrip: false,
    decoded: new Map<string, unknown>([
      ["a", 1],
      ["b", [2, 3]],
    ]),
  },
  {
    cbor: "gmFhv2FiYWP/",
    hex: "826161bf61626163ff",
    roundtrip: false,
    decoded: ["a", new Map([["b", "c"]])],
  },
  {
    cbor: "v2NGdW71Y0FtdCH/",
    hex: "bf6346756ef563416d7421ff",
    roundtrip: false,
    decoded: new Map<string, boolean | number>([
      ["Fun", true],
      ["Amt", -2],
    ]),
  },
];

describe("any", () => {
  test.each(TESTS)("decodes $hex => $decoded", (t) => {
    const d = new Decoder(new Uint8Array(fromHex(t.hex)), 0);
    const decoded = d.decode(any);
    const value = decoded.unwrap();
    expect(d.ptr).toBe(d.buf.length);
    if (Number.isNaN(t.decoded)) {
      expect(value).toBeNaN();
      return;
    }
    expect(value).toStrictEqual(t.decoded);
  });
  const SKIP_TESTS = TESTS;
  test.each(SKIP_TESTS)("decodes skips $hex", (t) => {
    const d = new Decoder(new Uint8Array(fromHex(t.hex)), 0);
    skip(d).unwrap();
    expect(d.ptr).toBe(d.buf.length);
  });
});
