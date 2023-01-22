import { Type } from "./Type";

export function typeToStr(type: Type): string {
  switch (type) {
    case Type.Bool:
      return "Bool";
    case Type.Null:
      return "Null";
    case Type.Undefined:
      return "Undefined";
    case Type.U8:
      return "U8";
    case Type.U16:
      return "U16";
    case Type.U32:
      return "U32";
    case Type.U64:
      return "U64";
    case Type.I8:
      return "I8";
    case Type.I16:
      return "I16";
    case Type.I32:
      return "I32";
    case Type.I64:
      return "I64";
    case Type.Int:
      return "Int";
    case Type.F16:
      return "F16";
    case Type.F32:
      return "F32";
    case Type.F64:
      return "F64";
    case Type.Simple:
      return "Simple";
    case Type.Bytes:
      return "Bytes";
    case Type.BytesIndef:
      return "BytesIndef";
    case Type.String:
      return "String";
    case Type.StringIndef:
      return "StringIndef";
    case Type.Array:
      return "Array";
    case Type.ArrayIndef:
      return "ArrayIndef";
    case Type.Map:
      return "Map";
    case Type.MapIndef:
      return "MapIndef";
    case Type.Tag:
      return "Tag";
    case Type.Break:
      return "Break";
  }
}
