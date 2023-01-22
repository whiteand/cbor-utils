import { u8 } from "./types";

export const UNSIGNED: u8 = 0x00;
export const SIGNED: u8 = 0x20;
export const BYTES: u8 = 0x40;
export const TEXT: u8 = 0x60;
export const ARRAY: u8 = 0x80;
export const MAP: u8 = 0xa0;
export const TAGGED: u8 = 0xc0;
export const SIMPLE: u8 = 0xe0;
export const BREAK: u8 = 0xff;
