import { CborType } from '../base'

export const flatMap = (newEncode, newDecode, nullable) =>
    (inner) => {
        const innerCborType = CborType.from(inner)

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
