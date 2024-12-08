import type { Context } from "hono"
import { getAccountInfo } from "../../info/getAccountInfo"
import { getMetadataInfoByQuery } from "../../info/getMetadataInfoByQuery"
import { getMosaicInfo } from "../../info/getMosaicInfo"
import { convertToMosaicActualAmount } from "../../utils/mosaicUtils"
import { metadataGenerateKey } from "symbol-sdk/symbol"

interface MetadataEntry {
  metadataEntry: {
    scopedMetadataKey: string
    value: string
  }
}

// メタデータ関連のユーティリティ関数
const generateMetadataKey = (key: string) =>
  metadataGenerateKey(key).toString(16).toUpperCase()
const decodeMetadataValue = (value: string) =>
  new TextDecoder().decode(Buffer.from(value, "hex"))
const encodeValue = (value: string) =>
  Buffer.from(new TextEncoder().encode(value)).toString("hex").toUpperCase()

const getNameFromMetadata = (mosaicId: string, metadata: MetadataEntry[]) => {
  const nameMetadata = metadata.find(
    (e: MetadataEntry) =>
      e.metadataEntry.scopedMetadataKey === generateMetadataKey("name"),
  )
  return nameMetadata
    ? decodeMetadataValue(nameMetadata.metadataEntry.value)
    : mosaicId
}

const isPointMosaicType = (metadata: MetadataEntry[]) => {
  return metadata.some(
    (e: MetadataEntry) =>
      e.metadataEntry.scopedMetadataKey === generateMetadataKey("type") &&
      e.metadataEntry.value === encodeValue("point"),
  )
}

const isRewardMosaicType = (metadata: MetadataEntry[]) => {
  return metadata.some(
    (e: MetadataEntry) =>
      e.metadataEntry.scopedMetadataKey === generateMetadataKey("type") &&
      e.metadataEntry.value === encodeValue("reward"),
  )
}

export const getMemberMosaics = async (c: Context) => {
  try {
    const address = c.req.param("address")
    const res = await getAccountInfo(address)

    const mosaics = await Promise.all(
      res.mosaics.map(async (mosaic: { id: string; amount: string }) => {
        const mosaicInfo = await getMosaicInfo(mosaic.id)
        const metadata = await getMetadataInfoByQuery(`targetId=${mosaic.id}`)
        const isPoint = isPointMosaicType(metadata)
        const isReward = isRewardMosaicType(metadata)

        return {
          id: mosaic.id,
          name:
            isPoint || isReward
              ? getNameFromMetadata(mosaic.id, metadata)
              : null,
          amount: convertToMosaicActualAmount(
            Number(mosaic.amount),
            mosaicInfo.divisibility,
          ),
        }
      }),
    )

    return c.json(mosaics)
  } catch (error) {
    console.error("Error fetching member mosaics:", error)
    return c.json({ error: "Failed to fetch member mosaics" }, 500)
  }
}
