import { Result } from "resultra";
import { ICborType, IDecoder, IEncoder } from "../types";
import { CborType } from "../base";
import { decodeSymbol, encodeSymbol } from "../traits";

export function convert<Encoded, Decoded>(
  toEncoded: (value: Encoded) => NoInfer<Decoded>,
  fromDecoded: (value: Decoded) => Encoded,
): <EC, EE, DC, DE>(
  ty: ICborType<Decoded, EC, EE, DC, DE>,
) => CborType<Encoded, EC, EE, DC, DE> {
  return <EC, EE, DC, DE>(
    ty: ICborType<Decoded, EC, EE, DC, DE>,
  ): CborType<Encoded, EC, EE, DC, DE> =>
    new CborType(
      (value: Encoded, e: IEncoder, ctx: EC): Result<void, EE> =>
        ty[encodeSymbol](toEncoded(value), e, ctx),
      (d: IDecoder, ctx: DC): Result<Encoded, DE> =>
        ty[decodeSymbol](d, ctx).map(fromDecoded),
    );
}
