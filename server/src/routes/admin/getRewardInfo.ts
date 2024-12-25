import type { Context } from "hono"
import { PublicKey } from "symbol-sdk"
import { SymbolFacade } from "symbol-sdk/symbol"
import { getAccountInfo } from "../../info/getAccountInfo"
import { getMetadataInfoByQuery } from "../../info/getMetadataInfoByQuery"
import { Config } from "../../utils/config"
import {
  checkMetadataType,
  decodeMetadataValue,
  fetchMosaicData,
} from "../../utils/metadataUtils"

interface Mosaic {
  id: string
  amount: string
}

type MetadataEntry = {
  metadataEntry: {
    scopedMetadataKey: string
    value: string
  }
}

/**
 * DAOが発行した特典モザイク情報を取得する
 */
export const getRewardInfo = async (c: Context) => {
  try {
    const daoId = c.req.param("id")

    const facade = new SymbolFacade(Config.NETWORK)
    const daoAccount = facade.createPublicAccount(new PublicKey(daoId))
    const address = daoAccount.address.toString()

    // アカウント情報の取得
    const accountInfo = await getAccountInfo(address)

    // 全モザイクのメタデータを一括取得
    const mdRes = await Promise.all(
      accountInfo.mosaics.map(async (mosaic: Mosaic) =>
        getMetadataInfoByQuery(`targetId=${mosaic.id}`),
      ),
    )

    const mosaicMetadatas = mdRes.map(
      (e: MetadataEntry[]) => {
        return e.map((e) => {
          return {
            key: BigInt(`0x${e.metadataEntry.scopedMetadataKey}`).toString(),
            value: decodeMetadataValue(e.metadataEntry.value),
          }
        })
      },
    )

    // 特典モザイク情報の取得
    const rewardMosaics = await Promise.all(
      accountInfo.mosaics.map(async (mosaic: Mosaic, index: number) => {
        const metadata = mosaicMetadatas[index]
        return metadata && checkMetadataType(metadata, "reward")
          ? fetchMosaicData(mosaic, metadata)
          : Promise.resolve(null)
      }),
    )

    return c.json(rewardMosaics.filter(Boolean))
  } catch (error) {
    console.error("特典情報取得エラー:", error)
    return c.json({ message: "特典情報の取得に失敗しました。" }, 500)
  }
}
