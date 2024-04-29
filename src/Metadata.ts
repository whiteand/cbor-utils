import { getType } from "./marker";

export class Metadata {
  public ty: number;
  public next: number;
  constructor() {
    this.ty = 255;
    this.next = 0;
  }
  setTypeFromMarker(marker: number): this {
    this.ty = getType(marker);
    return this;
  }
  setNext(ptr: number): this {
    this.next = ptr;
    return this;
  }
  getType(): number {
    return this.ty;
  }
  setType(type: number): this {
    this.ty = type;
    return this;
  }
}
