import { testCborType } from "../test-utils";
import { mapAsMap } from "./map";
import { u8 } from "./uint";

testCborType(
  "Record<u8, u8>",
  mapAsMap(u8, u8),
  [
    {
      decoded: new Map(),
      hex: "a0",
    },
    {
      decoded: new Map([
        [0, 0],
        [1, 1],
        [2, 4],
      ]),
      hex: "a3000001010204",
    },
  ],
  []
);
