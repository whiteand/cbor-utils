
export function flatMap(newEncode, newDecode) {
    return (inner) => {
        function FlatMapType() {
            super()
        }

        Object.setPrototypeOf(FlatMapType, inner)

        FlatMapType.prototype.encode = function encode(value, e, ctx) {
            const inner = newEncode(value, ctx);
            return inner.ok() ? super.encode(inner.value, e, ctx) : inner;
        }

        FlatMapType.prototype.decode = function decode(d, ctx) {
            const startPosition = d.ptr;
            const inner = super.decode(d, ctx);
            return inner.ok()
                ? newDecode(inner.value, d, ctx, startPosition)
                : inner
        }

        return new FlatMapType()
    }
}