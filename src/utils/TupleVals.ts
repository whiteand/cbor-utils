export type TupleVals<T> = T[Extract<keyof T, number>];
