export const decodeMetadataValue = (value: string) =>
  new TextDecoder().decode(Buffer.from(value, "hex"))

export const encodeValue = (value: string) =>
  Buffer.from(new TextEncoder().encode(value)).toString("hex").toUpperCase()
