import { createContext, isProvided, provide, useContext } from "./Context";

export const RemainingDataItemsContext = createContext<number>();

export function decRemaining(): void {
  if (isProvided(RemainingDataItemsContext)) {
    const oldValue = useContext(RemainingDataItemsContext);
    provide(RemainingDataItemsContext, oldValue - 1);
  }
}
