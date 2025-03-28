import { isProvided, provide, takeContext } from "../Context";
import { Decodable } from "../decodable";
import { Encodable } from "../encodable";
import { EOI_ERROR_CODE } from "../error-codes";
import { RemainingDataItemsContext } from "../remainingDataItems";
import { InputByteStream, OutputByteStream, SuccessResult } from "../types";

export abstract class SingleDataItemEncodable<T, Results> extends Encodable<
  T,
  Results
> {
  dataItems(): number {
    return 1;
  }
  minDataItems(): number {
    return 1;
  }
  maxDataItems(): number {
    return 1;
  }
  abstract encode(value: T, encoder: OutputByteStream): Results;
  abstract isNull(value: T): boolean;
}

export type MinimalResutls = SuccessResult | typeof EOI_ERROR_CODE;

export abstract class SingleDataItemDecodable<T, Results> extends Decodable<
  T,
  Results | MinimalResutls
> {
  abstract getValue(): T;
  abstract nullValue(): T;
  abstract hasNullValue(): boolean;
  protected abstract decodeItem(input: InputByteStream): Results;
  protected abstract skipItem(input: InputByteStream): Results;
  decode(input: InputByteStream): Results | MinimalResutls {
    if (isProvided(RemainingDataItemsContext)) {
      const old = takeContext(RemainingDataItemsContext);
      if (old <= 0) {
        return EOI_ERROR_CODE;
      }
      const res = this.decodeItem(input);
      if (res !== 0) return res;
      provide(RemainingDataItemsContext, old - 1);
      return 0;
    } else {
      return this.decodeItem(input);
    }
  }
  skip(input: InputByteStream): Results | MinimalResutls {
    if (isProvided(RemainingDataItemsContext)) {
      const old = takeContext(RemainingDataItemsContext);
      if (old <= 0) {
        return EOI_ERROR_CODE;
      }
      const res = this.skipItem(input);
      if (res !== 0) return res;
      provide(RemainingDataItemsContext, old - 1);
      return 0;
    } else {
      return this.skipItem(input);
    }
  }

  minDataItems(): number {
    return 1;
  }
  maxDataItems(): number {
    return 1;
  }
}
