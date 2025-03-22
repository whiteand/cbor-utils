# New Design

interface IEncodable<T, Ctx> extends Pipeable {
    __inferCtx: Ctx;
    __inferT: T
    setContext(ctx: Ctx): void;
    encode(value: T, encoder: IEncoder): number 
}

interface IDecodable<T, Ctx = unknown> extends Pipeable {
    __inferCtx: Ctx;
    __inferT: T
    setContext(ctx: Ctx): void
    // => 0 = success
    decode(decoder: IDecoder): number
    getValue(): T
}