# CBOR Utils

This library provides you with low level tools to use CBOR format.
It is inspired by `minicbor` crate in Rust and `rxjs` library in Javascript.

## API Docs

To see the full API Documentation, please visit [Docs](https://jsr.io/@whiteand/cbor/doc).

## Installation

Using npm:

```sh
npm install cbor-utils
```

Using jsr:

```sh
npx jsr add @whiteand/cbor
```

## Example:

If you want to encode something to Uint8Array you can use `encode` function.

```typescript
import { encode, u8, bytes, bool } from "cbor-utils";
const bytes = encode((e) => {
  e.encode(u8, 42);
  e.encode(bytes, new Uint8Array([1, 2, 3]));
  e.encode(bool, true);
});
```

If you want to decode something you can use `decode` function.

```typescript
import { ok, decode, Result, u8, bytes, bool } from "cbor-utils";

/**
 * @type {Result<{id: number, hash: Uint8Array, submitted: boolean }, DecodingError>
 */
const res = decode(cborBytes, (d) => {
  const id = d.decode(u8);
  if (!id.ok()) return id;
  const hash = d.decode(bytes);
  if (!hash.ok()) return hash;
  const submitted = d.decode(bool);
  if (!submitted.ok()) return submitted;
  return ok({
    id: id.value,
    hash: hash.value,
    submitted: submitted.value,
  });
});

//or less type safe version, but without necessity to check each decoded item result:
import { tryDecode, u8, bytes, bool } from "cbor-utils";

/**
 * @type {Result<{id: number, hash: Uint8Array, submitted: boolean }, unknown>
 */
const result2 = tryDecode(cborBytes, (d) => {
  const id = d.decode(u8);
  const hash = d.decode(bytes);
  const submitted = d.decode(bool);

  return {
    id,
    hash,
    submitted,
  };
});
```
