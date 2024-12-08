import { metadataGenerateKey } from "symbol-sdk/symbol"

export const generateMetadataKey = (key: string) =>
  metadataGenerateKey(key).toString(16).toUpperCase()

export const decodeMetadataValue = (value: string) =>
  new TextDecoder().decode(Buffer.from(value, "hex"))

export const encodeValue = (value: string) =>
  Buffer.from(new TextEncoder().encode(value)).toString("hex").toUpperCase()
