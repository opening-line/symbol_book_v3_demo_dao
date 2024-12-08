type Metadata = {
  key: string
  value: string
}
export const pickMetadata = (metadatas: Metadata[], key: bigint) => {
  return metadatas.filter((md: Metadata) => {
    try {
      return BigInt(md.key) === key
    } catch {
      return false
    }
  })[0]
}
