import { IReader, IWriter } from "./types";
import { IEncoder } from "./IEncoder";
import { IDecoder } from "./IDecoder";

export type WriterError<W extends IWriter<any>> = W["_INFER_ERROR"];
export type EncoderWriter<Enc extends IEncoder<any>> = Enc["_INFER_WRITER"];
export type EncoderWriterError<Enc extends IEncoder<any>> =
  Enc["_INFER_WRITER_ERROR"];
export type DecoderReader<W extends IDecoder<any>> = W["_INFER_READER"];
export type DecoderReaderError<W extends IDecoder<any>> =
  W["_INFER_READER_ERROR"];
export type AnyWriter = IWriter<any>;
export type AnyReader = IReader<any>;
export type AnyEncoder = IEncoder<AnyWriter>;
export type AnyDecoder = IDecoder<AnyReader>;
