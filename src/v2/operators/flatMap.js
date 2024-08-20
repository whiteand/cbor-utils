
export function flatMap(newEncode, newDecode) {
    return (inner) => {
        const obj = {
            encode(value, e, ctx) {
                const inner = newEncode(value, ctx);
                return inner.ok() ? super.encode(inner.value, e, ctx) : inner;
            },
            decode(d, ctx) {
                const startPosition = d.ptr;
                const inner = super.decode(d, ctx);
                return inner.ok()
                    ? newDecode(inner.value, d, ctx, startPosition)
                    : inner
            }
        }

        Reflect.setPrototypeOf(obj, inner)

        return obj
    }
}