import { createContext, IContext } from "./Context";

export const RemainingDataItemsContext: IContext<number> =
  createContext<number>();
