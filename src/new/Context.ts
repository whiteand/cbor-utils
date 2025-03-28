import { Z } from "../types";

class Context<T> {
  public value!: T;
  public provided: boolean;
  constructor() {
    this.provided = false;
  }
  provide(value: T): void {
    this.value = value;
    this.provided = true;
  }
  read(): T {
    return this.value!;
  }
  forget(): void {
    this.provided = false;
  }
}

export interface IContext<T> {
  __inferCtx: T;
}

/** Creates a point of injection of the context */
export function createContext<T>(): IContext<T> {
  return new Context() as Z as IContext<T>;
}

export type TOwner = number & { owner: true };

/** Reads value from the context */
export function useContext<T>(ctx: IContext<T>): T {
  return (ctx as Z as Context<T>).value;
}

export function takeContext<T>(ctx: IContext<T>): T {
  (ctx as Z as Context<T>).provided = false;
  return (ctx as Z as Context<T>).value;
}

export function isProvided<T>(ctx: IContext<T>): boolean {
  return (ctx as Z as Context<T>).provided;
}

export function provide<T, Ctx extends IContext<T>>(ctx: Ctx, value: T): Ctx {
  (ctx as Z as Context<T>).value = value;
  (ctx as Z as Context<T>).provided = true;
  return ctx;
}

export function free<T>(ctx: IContext<T>): void {
  (ctx as Z as Context<T>).provided = false;
}
