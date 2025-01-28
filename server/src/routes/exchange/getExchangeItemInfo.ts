import type { Context } from "hono"
import { PublicKey } from "symbol-sdk"
import { SymbolFacade } from "symbol-sdk/symbol"
import { getAccountInfo } from "../../info/getAccountInfo"
import { getMetadataInfoByQuery } from "../../info/getMetadataInfoByQuery"
import { Config } from "../../utils/config"
import {
  decodeMetadataValue,
  fetchMosaicData,
  getMetadataValue,
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

interface ExchangeItem {
  mosaic: Mosaic
  pointMosaicId: string
  pointMosaicName: string
  description: string
  exchangeCost: number
}

/**
 * 交換アイテムの情報を取得する
 */
export const getExchangeItemInfo = async (c: Context) => {
  try {
    const daoId = c.req.param("id")

    const facade = new SymbolFacade(Config.NETWORK)
    const daoAccount = facade.createPublicAccount(new PublicKey(daoId))
    const address = daoAccount.address.toString()

    // アカウント情報の取得
    const accountInfo = await getAccountInfo(address)
    if (!accountInfo?.mosaics?.length) {
      return c.json({ message: "モザイクが見つかりません。" }, 404)
    }

    // 全モザイクのメタデータを一括取得
    const mdRes = await Promise.all(
      accountInfo.mosaics.map((mosaic: Mosaic) =>
        getMetadataInfoByQuery(`targetId=${mosaic.id}`),
      ),
    )

    const mosaicMetadatas = mdRes.map((e: MetadataEntry[]) =>
      e.map((e) => ({
        key: BigInt(`0x${e.metadataEntry.scopedMetadataKey}`).toString(),
        value: decodeMetadataValue(e.metadataEntry.value),
      })),
    )

    // 交換アイテムモザイク情報の取得
    const exchangeItems: ExchangeItem[] = (
      await Promise.all(
        accountInfo.mosaics.map(async (mosaic: Mosaic, index: number) => {
          const metadata = mosaicMetadatas[index]
          if (!metadata || !getMetadataValue("exchangeable", metadata)) {
            return null
          }

          const mosaicData = await fetchMosaicData(mosaic, metadata)
          if (!mosaicData) {
            return null
          }

          return {
            mosaic: mosaicData,
            pointMosaicId: getMetadataValue("pointMosaicId", metadata),
            pointMosaicName:
              getMetadataValue("pointMosaicName", metadata) ||
              getMetadataValue("pointMosaicId", metadata),
            description: getMetadataValue("description", metadata),
            exchangeCost: Number(getMetadataValue("exchangeCost", metadata)),
          }
        }),
      )
    ).filter(Boolean)

    return c.json(exchangeItems)
  } catch (error) {
    console.error("交換アイテム情報取得エラー:", error)
    return c.json(
      {
        message: "交換アイテム情報の取得に失敗しました。",
        error: error instanceof Error ? error.message : String(error),
      },
      500,
    )
  }
}
