import { CborType } from "../base";
import { DecodingError } from "../DecodingError";
import { TaggedDataItem } from "../default/DataItem";
import { OverflowError } from "../OverflowError";
import { ICborType } from "../types";
import { UnexpectedValueError } from "../UnexpectedValueError";

declare function tagged(
  tag: number | bigint
): <ET, DT, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborType<ET, DT, EE, DE, EC, DC>
) => CborType<
  Readonly<TaggedDataItem<ET>>,
  TaggedDataItem<DT>,
  EE | OverflowError | UnexpectedValueError<number | bigint, number | bigint>,
  DE | DecodingError | UnexpectedValueError<number | bigint, number | bigint>,
  EC,
  DC
>;
declare function tagged(): <ET, DT, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborType<ET, DT, EE, DE, EC, DC>
) => CborType<
  Readonly<TaggedDataItem<ET>>,
  TaggedDataItem<DT>,
  EE | OverflowError,
  DE | DecodingError,
  EC,
  DC
>;

declare function tagged(
  tag?: number | bigint
): <ET, DT, EE extends Error, DE extends Error, EC, DC>(
  ty: ICborType<ET, DT, EE, DE, EC, DC>
) => CborType<
  Readonly<TaggedDataItem<ET>>,
  TaggedDataItem<DT>,
  EE | OverflowError | UnexpectedValueError<number | bigint, number | bigint>,
  DE | DecodingError | UnexpectedValueError<number | bigint, number | bigint>,
  EC,
  DC
>;
