import type { Context } from "hono"
import { metadataGenerateKey } from "symbol-sdk/symbol"
import { getMetadataInfo } from "../../info/getMetadataInfo"

interface MetadataEntry {
  metadataEntry: {
    scopedMetadataKey: string
    value: string
  }
}

// メタデータ関連のユーティリティ関数
const generateMetadataKey = (key: string) => metadataGenerateKey(key).toString(16).toUpperCase()
const decodeMetadataValue = (value: string) => new TextDecoder().decode(Buffer.from(value, 'hex'))

const getThemeNameFromMetadata = (metadata: MetadataEntry[]) => {
  const themeMetadata = metadata.find(
    (e: MetadataEntry) => e.metadataEntry.scopedMetadataKey === generateMetadataKey("theme")
  )
  return themeMetadata ? decodeMetadataValue(themeMetadata.metadataEntry.value) : "default"
}

export const getTheme = async (c: Context) => {
  const { address } = (await c.req.json()) as { address: string }

  const accountMetadata = await getMetadataInfo(`targetAddress=${address}`)
  const theme = getThemeNameFromMetadata(accountMetadata)

  return c.json({ theme })
}
