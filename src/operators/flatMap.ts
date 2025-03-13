import { Result } from "resultra";
import { CborType } from "../base";
import { ICborType, IDecoder, IEncoder, NotImportant } from "../types";

type TFlatMap = <OldEncodedType, NewEncodedType, OldDecodedType, NewDecodedType, NEE extends Error, NDE extends Error, NEC, NDC>(
  newEnc: (value: NewEncodedType, ctx: NEC) => Result<NoInfer<OldEncodedType>, NEE>,
  newDec: (value: OldDecodedType, decoder: IDecoder, ctx: NDC, startPosition: number) => Result<NewDecodedType, NDE>, nullable?: boolean) => <EE extends Error, DE extends Error, EC extends NEC, DC extends NDC>(ty: ICborType<OldEncodedType, OldDecodedType, EE, DE, EC, DC>) => CborType<NewEncodedType, NewDecodedType, NEE | EE, NDE | DE, NEC & EC, NDC & DC>

export const flatMap: TFlatMap = (newEncode, newDecode, nullable) => (ty) => {

  
  interface IObj {
    newEncode(value: NotImportant, ctx: NotImportant): Result<NotImportant, NotImportant>;
    newDecode(value: NotImportant, d: NotImportant, ctx: NotImportant, startPosition: number): Result<NotImportant, NotImportant>;
    sourceType: ICborType<NotImportant, NotImportant, NotImportant, NotImportant, NotImportant, NotImportant>;
  }
  
  const proto = CborType.builder()
    .encode(function encode(this: IObj, value: unknown, e: IEncoder, ctx: unknown) {
      const innerValueRes = this.newEncode(value, ctx);
      if (!innerValueRes.ok()) {
        return innerValueRes;
      }

      const innerValue = innerValueRes.value;

      return this.sourceType.encode(innerValue, e, ctx);
    })
    .decode(function decode(this: IObj, d: IDecoder, ctx: unknown) {
      const startPosition = d.ptr;
      const inner = this.sourceType.decode(d, ctx);
      return inner.ok()
        ? this.newDecode(inner.value, d, ctx, startPosition)
        : inner;
    })
    .nullable(nullable ?? ty.nullable)
    .build();

  const obj = {
    newEncode,
    newDecode,
    sourceType: ty,
  };

  Reflect.setPrototypeOf(obj, proto);

  return obj as NotImportant
};
