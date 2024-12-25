import type { Context } from "hono"
import { PublicKey } from "symbol-sdk"
import { SymbolFacade } from "symbol-sdk/symbol"
import { pickMetadata } from "../../functions/pickMetadata"
import { getAccountInfo } from "../../info/getAccountInfo"
import { getMetadataInfoByQuery } from "../../info/getMetadataInfoByQuery"
import { Config } from "../../utils/config"
import { METADATA_KEYS } from "../../utils/metadataKeys"
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
 * DAOが発行したポイントモザイク情報を取得する
 */
export const getPointInfo = async (c: Context) => {
  try {
    const daoId = c.req.param("id")

    const textDecoder = new TextDecoder()
    const facade = new SymbolFacade(Config.NETWORK)
    const daoAccount = facade.createPublicAccount(new PublicKey(daoId))
    const address = daoAccount.address.toString()

    // アカウント情報とメタデータの取得
    const accountInfo = await getAccountInfo(address)
    const accountMdRes = await getMetadataInfoByQuery(
      `targetAddress=${address}`,
    )
    const accountMetadatas = accountMdRes.map((e: MetadataEntry) => {
      return {
        key: e.metadataEntry.scopedMetadataKey,
        value: textDecoder.decode(
          Uint8Array.from(Buffer.from(e.metadataEntry.value, "hex")),
        ),
      }
    })

    // ガバナンストークンIDの取得
    const govTokenId = pickMetadata(
      accountMetadatas,
      METADATA_KEYS.GOVERNANCE_TOKEN_ID,
    )!.value.toUpperCase()

    // 全モザイクのメタデータを取得
    const [govTokenMdRes, ...pointMosaicsMdRes] = await Promise.all([
      getMetadataInfoByQuery(`targetId=${govTokenId}`),
      ...accountInfo.mosaics.map((mosaic: Mosaic) =>
        getMetadataInfoByQuery(`targetId=${mosaic.id}`),
      ),
    ])

    const mosaicMetadatas = [govTokenMdRes, ...pointMosaicsMdRes]
      .map((e: MetadataEntry[]) => {
        return e.map((e) => {
          return {
            key: BigInt(`0x${e.metadataEntry.scopedMetadataKey}`).toString(),
            value: decodeMetadataValue(e.metadataEntry.value),
          }
        })
      })

    // ポイントモザイク情報の取得
    const [govToken, ...pointMosaics] = await Promise.all([
      fetchMosaicData({
        id: govTokenId,
        amount: accountInfo.mosaics.find(
          (mosaic: Mosaic) => mosaic.id === govTokenId,
        )?.amount || "0",
      }),
      ...accountInfo.mosaics.map((mosaic: Mosaic, index: number) => {
        const metadata = mosaicMetadatas[index + 1]
        return metadata && checkMetadataType(metadata, "point")
          ? fetchMosaicData(mosaic, metadata)
          : Promise.resolve(null)
      }),
    ])

    return c.json([govToken, ...pointMosaics.filter(Boolean)])
  } catch (error) {
    console.error("ポイント情報取得エラー:", error)
    return c.json({ message: "ポイント情報の取得に失敗しました。" }, 500)
  }
}
