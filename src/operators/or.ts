import { err } from "resultra";
import { CborType } from "../base";
import { BaseError } from "../BaseError";
import {
  Assume,
  DecodedType,
  DecodeError,
  EncodedType,
  EncodeError,
  ICborType,
  IDecoder,
  IEncoder,
  Z,
  AndManyContextsArgs,
  SelectContextArgsFromProp,
} from "../types";
import { TupleVals } from "../utils/TupleVals";

type InferEncodedOrType<
  TS extends readonly ICborType<Z, Z, Error, Error, Z, Z>[]
> = TupleVals<{
  [ind in keyof TS]: EncodedType<TS[ind]>;
}>;

type InferDecodedOrType<
  TS extends readonly ICborType<Z, Z, Error, Error, Z, Z>[]
> = TupleVals<{
  [ind in keyof TS]: DecodedType<TS[ind]>;
}>;

type OrEncodeErrors<TS extends readonly ICborType<Z, Z, Error, Error, Z, Z>[]> =
  {
    [ind in keyof TS]: EncodeError<TS[ind]>;
  };

type OrDecodeErrors<TS extends readonly ICborType<Z, Z, Error, Error, Z, Z>[]> =
  {
    [ind in keyof TS]: DecodeError<TS[ind]>;
  };

/**
 * Represents the situation when all of the possible types failed to encode or decode a value.
 */
class OrError<const Errs extends readonly Error[]> extends BaseError {
  public readonly errors: Errs;
  constructor(errors: Errs) {
    super(
      `failed or error: ${errors.map((e) => `"${e.message}"`).join(" & ")}`
    );
    this.errors = errors;
  }
}

/**
 * Given the list of CBOR types creates a new type that will
 * try each type to encode or decoded a value in the order of their appearance
 * in the list.
 *
 * @param types Types that will be tried to encode or decode a value
 * @returns new type that will try each type to encode or decode a value
 */
export function or<const Types extends readonly ICborType<Z, Z, Z, Z, Z, Z>[]>(
  ...types: Types
): CborType<
  InferEncodedOrType<Types>,
  InferDecodedOrType<Types>,
  OrError<Assume<OrEncodeErrors<Types>, Error[]>>,
  OrError<Assume<OrDecodeErrors<Types>, Error[]>>,
  AndManyContextsArgs<SelectContextArgsFromProp<Types, "__inferEncodingCtx">>,
  AndManyContextsArgs<SelectContextArgsFromProp<Types, "__inferDecodingCtx">>
> {
  interface IOr {
    types: Types;
  }

  const proto = CborType.builder()
    .encode(function encode(this: IOr, v: Z, e: IEncoder, ctx: Z) {
      const p = e.save();
      const errors = [] as Error[];
      const { types } = this;
      for (const ty of types) {
        const res = (ty.encode as Z)(v, e, ctx);
        if (res.ok()) {
          return res;
        } else {
          errors.push(res.error);
          e.restore(p);
        }
      }
      return err(new OrError(errors));
    })
    .decode(function decode(this: IOr, d: IDecoder, c: Z) {
      const p = d.ptr;
      const errors = [] as Error[];
      const { types } = this;
      for (const ty of types) {
        const res = (ty.decode as Z)(d, c);
        if (res.ok()) {
          return res;
        } else {
          errors.push(res.error);
          d.ptr = p;
        }
      }
      return err(new OrError(errors));
    })
    .nullable(types.some((t) => t.nullable))
    .build();

  const orType = {
    types,
  };

  Reflect.setPrototypeOf(orType, proto);

  return orType as Z as CborType<
    InferEncodedOrType<Types>,
    InferDecodedOrType<Types>,
    OrError<Assume<OrEncodeErrors<Types>, Error[]>>,
    OrError<Assume<OrDecodeErrors<Types>, Error[]>>,
    AndManyContextsArgs<SelectContextArgsFromProp<Types, "__inferEncodingCtx">>,
    AndManyContextsArgs<SelectContextArgsFromProp<Types, "__inferDecodingCtx">>
  >;
}
