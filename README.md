# CBOR Utils

This library provides you with low level access to CBOR format

## Example:

If you want to encode something to Uint8Array you can use `encode` function.

```typescript
import { encode } from 'cbor-utils'
const bytes = encode(e => {
    e.u8(42)
    e.bytes(new Uint8Array([1,2,3]))
    e.bool(true)
})
```

If you want to decode something you can use `decode` function.


```typescript
import { ok, decode } from 'cbor-utils'

const result = decode(bytes, d => {
    const id = d.u8()
    if (!id.ok()) return id
    const hash = d.bytes()
    if (!hash.ok()) return hash
    const submitted = d.bool()
    if (!submitted.ok()) return submitted

    return ok({
        id: id.value,
        hash: hash.value,
        submitted: submitted.value
    })
})