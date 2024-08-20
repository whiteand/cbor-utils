import { CborType } from '../base'

export const flatMap = (newEncode, newDecode, nullable) =>
    (inner) => {
        const innerCborType = inner instanceof CborType
            ? inner
            : CborType.builder()
                .encode((v, e, c) => inner.encode(v, e, c))
                .decode((d, c) => inner.decode(d, c))
                .nullable(inner.nullable)
                .build()

        const obj = {
            newEncode,
            newDecode,
            encode(value, e, ctx) {
                const inner = this.newEncode(value, ctx);
                return inner.ok() ? super.encode(inner.value, e, ctx) : inner;
            },
            decode(d, ctx) {
                const startPosition = d.ptr;
                const inner = super.decode(d, ctx);
                return inner.ok()
                    ? this.newDecode(inner.value, d, ctx, startPosition)
                    : inner
            },
            nullable: nullable ?? innerCborType.nullable
        }

        Reflect.setPrototypeOf(obj, innerCborType)

        return obj
    }
