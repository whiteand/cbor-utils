import * as x from "../../dist/index.js";
const LEN = 50;

const histogramBigint = (bigints: bigint[], buckets: number) => {
  const min = bigints.reduce((a, b) => (a < b ? a : b));
  const max = bigints.reduce((a, b) => (a > b ? a : b));
  const range = max - min;
  let bucketSize = range / BigInt(buckets);
  if (bucketSize === 0n) {
    bucketSize = 1n;
  }

  const histogram: { from: bigint; to: bigint; values: number }[] = new Array(
    buckets
  ).fill(0);
  for (let i = 0; i < buckets; i++) {
    histogram[i] = {
      from: min + BigInt(i) * bucketSize,
      to: min + BigInt(i + 1) * bucketSize,
      values: 0,
    };
  }
  for (const bigint of bigints) {
    const index = Number((bigint - min) / bucketSize);
    if (index >= 0 && index < buckets) {
      histogram[index].values++;
    }
  }
  return histogram;
};
function drawHistogram(histogram: number[], labels: string[]) {
  const max = Math.max(...histogram);
  const scale = 50 / max;
  for (let i = 0; i < histogram.length; i++) {
    const bar = "#".repeat(histogram[i] * scale);
    console.log(`${labels[i]}: ${bar}`);
  }
}

/**
 * Returns a random integer between min and upperBound (exclusive).
 */
function randomInt(min: number, upperBound: number): number {
  if (min > upperBound) {
    throw new Error("Min must be less than max");
  }
  return Math.floor(Math.random() * (upperBound - min) + min);
}

function randomItemOf<T>(
  list: readonly T[],
  weights: number[] | null = null
): T {
  if (list.length === 0) {
    throw new Error("List is empty");
  }
  if (weights == null) {
    return list[randomInt(0, list.length)];
  }
  if (list.length !== weights.length) {
    throw new Error("List and weights must have the same length");
  }
  const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
  const random = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulativeWeight += weights[i];
    if (random < cumulativeWeight) {
      return list[i];
    }
  }

  throw new Error("Should not reach here");
}

function randomBoolean(): boolean {
  return Math.random() < 0.5;
}
function randomBigint(min: bigint, upperBound: bigint): bigint {
  if (min >= upperBound) {
    throw new Error("Min must be less than max");
  }
  if (min !== 0n) {
    const range = upperBound - min;
    return min + randomBigint(0n, range);
  }
  if (upperBound < 2n ** 32n) {
    return BigInt(randomInt(0, Number(upperBound)));
  }
  const upperBoundBits = upperBound.toString(2).length;
  let currentBits = 0;
  let res = 0n;
  while (currentBits < upperBoundBits) {
    const newBits = BigInt(randomInt(0, 2 ** 32));
    res = (res << BigInt(32)) | newBits;
    currentBits += 32;
  }

  return res % upperBound;
}

function randomUintByBits(bits: number): number {
  return randomInt(0, 2 ** bits);
}

function* repeat<T>(f: () => T) {
  while (true) {
    yield f();
  }
}

interface IGeneratable {
  cborTy: x.CborType<any, any, any, any, any, any>;
  gen: () => any;
  describe: () => string;
}

const primitives: IGeneratable[] = [
  {
    cborTy: x.u8,
    gen: () => randomUintByBits(8),
    describe: () => "u8",
  },
  {
    cborTy: x.u16,
    gen: () => randomUintByBits(16),
    describe: () => "u16",
  },
  {
    cborTy: x.u32,
    gen: () => randomUintByBits(32),
    describe: () => "u32",
  },
  {
    cborTy: x.u64,
    gen: () => randomBigint(0n, 2n ** 64n),
    describe: () => "u64",
  },
  {
    cborTy: x.bytes,
    gen: () => {
      const len = randomInt(0, LEN);
      return globalThis.crypto.getRandomValues(new Uint8Array(len));
    },
    describe: () => "bytes",
  },
  {
    cborTy: x.bool,
    gen: () => {
      return randomBoolean();
    },
    describe: () => "bool",
  },
  {
    cborTy: x.undefinedType,
    gen: () => {
      return undefined;
    },
    describe: () => "undefined",
  },
  {
    cborTy: x.nullType,
    gen: () => {
      return null;
    },
    describe: () => "null",
  },
  {
    cborTy: x.str,
    gen: () => {
      const len = randomInt(0, LEN);
      return repeat(() => randomInt(0, 128))
        .take(len)
        .map((code) => String.fromCharCode(code))
        .reduce((acc, char) => acc + char, "");
    },
    describe: () => "str",
  },
];

function randomArrayGeneratable(nestedness: number = 1): IGeneratable {
  const itemGenerator =
    nestedness <= 1
      ? randomItemOf(primitives)
      : randomGeneratableOfNestedness(nestedness - 1);
  return {
    cborTy: itemGenerator.cborTy.pipe(x.array()),
    gen: () => {
      const len = randomInt(0, LEN);
      return repeat(() => itemGenerator.gen())
        .take(len)
        .toArray();
    },
    describe: () => `Array<${itemGenerator.describe()}>`,
  };
}
function randomMapGeneratable(nestedness: number = 1): IGeneratable {
  const keyGen = randomItemOf(primitives);
  const valueGen =
    nestedness <= 1
      ? randomItemOf(primitives)
      : randomGeneratableOfNestedness(nestedness - 1);
  return {
    cborTy: x.map(keyGen.cborTy, valueGen.cborTy),
    gen: () => {
      const len = randomInt(0, LEN);
      return repeat(() => [keyGen.gen(), valueGen.gen()])
        .take(len)
        .reduce((acc, [key, value]) => {
          acc.set(key as string, value);
          return acc;
        }, new Map());
    },
    describe: () => `Map<${keyGen.describe()}, ${valueGen.describe()}>`,
  };
}

function randomGeneratableOfNestedness(nestedness: number = 0) {
  if (nestedness <= 0) {
    return randomItemOf(primitives);
  }
  const ty = randomItemOf(["array", "map"] as const);
  if (ty === "array") {
    return randomArrayGeneratable(nestedness);
  }
  if (ty === "map") {
    return randomMapGeneratable(nestedness);
  }
  throw new Error("Unknown type");
}
function randomGeneretable() {
  const nestedness = randomInt(0, 2);
  return randomGeneratableOfNestedness(nestedness);
}

function hex(buffer: Uint8Array): string {
  let res = "";
  for (let i = 0; i < buffer.length; i++) {
    res += buffer[i].toString(16).padStart(2, "0");
  }
  return res;
}

console.log("[");
let generated = 0;
for (const t of repeat(() => randomGeneretable()).take(10000)) {
  if (generated > 0) {
    process.stdout.write(",\n");
  }
  generated += 1;
  const value = t.gen();
  const encoded = x.encode((e) => t.cborTy.encode(value, e));
  const obj = {
    x: hex(encoded),
    description: t.describe(),
  };
  process.stdout.write(JSON.stringify(obj));
}
console.log("\n]");
