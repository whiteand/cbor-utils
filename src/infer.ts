import { IReader, IWriter } from "./types";
import { IEncoder } from "./IEncoder";
import { IDecoder } from "./IDecoder";

export type AnyWriter = IWriter<any>;
export type AnyReader = IReader<any>;
export type AnyEncoder = IEncoder<AnyWriter>;
export type AnyDecoder = IDecoder<AnyReader>;

export type WriterError<W extends AnyWriter> = W["_INFER_ERROR"];
export type ReaderError<W extends AnyReader> = W["_INFER_ERROR"];
export type EncoderWriter<Enc extends AnyEncoder> = Enc["_INFER_WRITER"];
export type EncoderWriterError<Enc extends AnyEncoder> =
  Enc["_INFER_WRITER_ERROR"];
export type DecoderReader<W extends AnyDecoder> = W["_INFER_READER"];
export type DecoderReaderError<W extends AnyDecoder> = W["_INFER_READER_ERROR"];
