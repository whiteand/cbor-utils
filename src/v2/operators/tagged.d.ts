import { Result, ok } from "resultra";
import { CborType } from "../base";
import { DecodingError } from "../DecodingError";
import { TaggedDataItem } from "../default/DataItem";
import { OverflowError } from "../OverflowError";
import { ICborTypeCodec, IDecoder, IEncoder } from "../types";
import { UnexpectedValueError } from "../UnexpectedValueError";

declare function tagged(
  tag: number | bigint
): <ET, DT, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborTypeCodec<ET, DT, EE, DE, EC, DC>
) => ICborTypeCodec<
  TaggedDataItem<ET>,
  TaggedDataItem<DT>,
  EE | OverflowError | UnexpectedValueError<number | bigint, number | bigint>,
  DE | DecodingError | UnexpectedValueError<number | bigint, number | bigint>,
  EC,
  DC
>;
declare function tagged(): <ET, DT, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborTypeCodec<ET, DT, EE, DE, EC, DC>
) => ICborTypeCodec<
  TaggedDataItem<ET>,
  TaggedDataItem<DT>,
  EE | OverflowError,
  DE | DecodingError,
  EC,
  DC
>;

declare function tagged(
  tag?: number | bigint
): <ET, DT, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborTypeCodec<ET, DT, EE, DE, EC, DC>
) => ICborTypeCodec<
  TaggedDataItem<ET>,
  TaggedDataItem<DT>,
  EE | OverflowError | UnexpectedValueError<number | bigint, number | bigint>,
  DE | DecodingError | UnexpectedValueError<number | bigint, number | bigint>,
  EC,
  DC
>;
