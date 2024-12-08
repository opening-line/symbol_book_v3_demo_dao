type Metadata = {
  key: string
  value: string
}

/**
 * メタデータの取得
 * @param metadatas メタデータ
 * @param key メタデータキー
 * @returns メタデータが存在するかどうか
 */
export const pickMetadata = (metadatas: Metadata[], key: bigint) => {
  return metadatas.filter((md: Metadata) => {
    try {
      return BigInt(md.key) === key
    } catch {
      return false
    }
  })[0]
}
