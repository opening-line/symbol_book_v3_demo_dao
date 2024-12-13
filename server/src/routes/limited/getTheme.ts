import type { Context } from "hono"
import { metadataGenerateKey } from "symbol-sdk/symbol"
import { pickMetadata } from "../../functions/pickMetadata"
import { getMetadataInfoByQuery } from "../../info/getMetadataInfoByQuery"
import { decodeMetadataValue } from "../../utils/metadataUtils"

type MetadataEntry = {
  metadataEntry: {
    scopedMetadataKey: string
    value: string
  }
}

/**
 * テーマ名を取得する
 */
export const getTheme = async (c: Context) => {
  const address = c.req.param("address")
  const mdRes = await getMetadataInfoByQuery(`targetAddress=${address}`)
  const metadatas = mdRes.map(
    (e: MetadataEntry) => {
      return {
        key: BigInt(`0x${e.metadataEntry.scopedMetadataKey}`).toString(),
        value: decodeMetadataValue(e.metadataEntry.value),
      }
    },
  )
  const theme = pickMetadata(metadatas, metadataGenerateKey("theme"))?.value

  return c.json({ theme })
}
