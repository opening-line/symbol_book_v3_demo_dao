type Metadata = {
  key: string,
  value: string
}
export const pickMetadata = (metadatas: Metadata[], key: bigint) => {
  return metadatas.filter((md: Metadata) => {
    return BigInt(md.key) === key
  })[0]
}