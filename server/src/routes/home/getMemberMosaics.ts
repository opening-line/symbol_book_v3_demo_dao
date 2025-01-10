import type { Context } from "hono"
import { getAccountInfo } from "../../info/getAccountInfo"
import { getMetadataInfoByQuery } from "../../info/getMetadataInfoByQuery"
import { getMosaicInfo } from "../../info/getMosaicInfo"
import {
  checkMetadataType,
  decodeMetadataValue,
  getNameFromMetadata,
} from "../../utils/metadataUtils"
import { convertToMosaicActualAmount } from "../../utils/mosaicUtils"

type MetadataEntry = {
  metadataEntry: {
    scopedMetadataKey: string
    value: string
  }
}

/**
 * メンバーが保有するモザイク一覧取得
 */
export const getMemberMosaics = async (c: Context) => {
  try {
    const address = c.req.param("address")

    // アカウント情報の取得
    const accountInfo = await getAccountInfo(address)

    // アカウントが保有しているモザイク情報の取得
    const mosaics = await Promise.all(
      accountInfo.mosaics.map(
        async (mosaic: { id: string; amount: string }) => {
          const mosaicInfo = await getMosaicInfo(mosaic.id)
          const mdRes = await getMetadataInfoByQuery(`targetId=${mosaic.id}`)
          const metadatas = mdRes.map((e: MetadataEntry) => {
            return {
              key: BigInt(`0x${e.metadataEntry.scopedMetadataKey}`).toString(),
              value: decodeMetadataValue(e.metadataEntry.value),
            }
          })

          // ポイントモザイクまたは特典モザイクか確認
          const isPoint = checkMetadataType(metadatas, "point")
          const isReward = checkMetadataType(metadatas, "reward")

          return {
            id: mosaic.id,
            name:
              isPoint || isReward
                ? getNameFromMetadata(metadatas, mosaic.id)
                : null,
            amount: convertToMosaicActualAmount(
              Number(mosaic.amount),
              mosaicInfo.divisibility,
            ),
          }
        },
      ),
    )

    return c.json(mosaics)
  } catch (error) {
    console.error("モザイク一覧取得エラー:", error)
    return c.json({ message: "モザイク一覧の取得に失敗しました" }, 500)
  }
}
