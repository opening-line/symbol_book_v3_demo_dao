import type { Context } from "hono"
import { PublicKey } from "symbol-sdk"
import { metadataGenerateKey, SymbolFacade } from "symbol-sdk/symbol"
import { pickMetadata } from "../../functions/pickMetadata"
import { getAccountInfo } from "../../info/getAccountInfo"
import { getMetadataInfoByQuery } from "../../info/getMetadataInfoByQuery"
import { getMosaicInfo } from "../../info/getMosaicInfo"
import { Config } from "../../utils/config"
import { METADATA_KEYS } from "../../utils/metadataKeys"
import { convertToMosaicActualAmount } from "../../utils/mosaicUtils"

interface Mosaic {
  id: string
  amount: string
}

interface MosaicData {
  id: string
  maxSupply: string
  balance: number
  name?: string
}

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

/**
 * モザイク情報を取得する共通関数
 */
async function fetchMosaicData(mosaic: Mosaic): Promise<MosaicData> {
  const mosaicInfo = await getMosaicInfo(mosaic.id)
  return {
    id: mosaic.id,
    maxSupply: mosaicInfo.supply.toString(),
    balance: convertToMosaicActualAmount(
      Number(mosaic.amount),
      mosaicInfo.divisibility,
    ),
  }
}

/**
 * DAOが発行したポイントモザイク情報を取得する
 */
export const getPointInfo = async (c: Context) => {
  try {
    const id = c.req.param("id")
    const facade = new SymbolFacade(Config.NETWORK)
    const daoAccount = facade.createPublicAccount(new PublicKey(id))
    const address = daoAccount.address.toString()

    // アカウント情報とメタデータの取得
    const accountInfo = await getAccountInfo(address)
    const accountMetadata = await getMetadataInfoByQuery(`targetAddress=${address}`)

    // ガバナンストークンIDの取得
    const governanceMosaicId = pickMetadata(
      accountMetadata.map((e: MetadataEntry) => ({
        key: e.metadataEntry.scopedMetadataKey,
        value: decodeMetadataValue(e.metadataEntry.value),
      })),
      METADATA_KEYS.GOVERNANCE_TOKEN_ID,
    ).value.toUpperCase()

    // 全モザイクのメタデータを一括取得
    const mosaicMetadatas = await Promise.all([
      getMetadataInfoByQuery(`targetId=${governanceMosaicId}`),
      ...accountInfo.mosaics.map((mosaic: Mosaic) =>
        getMetadataInfoByQuery(`targetId=${mosaic.id}`),
      ),
    ])

    // ガバナンストークンの処理
    const governanceMosaic = {
      ...(await fetchMosaicData({
        id: governanceMosaicId,
        amount:
          accountInfo.mosaics.find(
            (mosaic: Mosaic) => mosaic.id === governanceMosaicId,
          )?.amount || "0",
      })),
      name: getNameFromMetadata(governanceMosaicId, mosaicMetadatas[0]),
    }

    // ポイントモザイクの処理
    const pointMosaics = await Promise.all(
      accountInfo.mosaics.map(async (mosaic: Mosaic, index: number) => {
        try {
          const metadata = mosaicMetadatas[index + 1]
          if (!isPointMosaicType(metadata)) {
            return null
          }

          return {
            ...(await fetchMosaicData(mosaic)),
            name: getNameFromMetadata(mosaic.id, metadata),
          }
        } catch (error) {
          console.error(`メタデータ取得エラー: ${mosaic.id}`, error)
          return null
        }
      }),
    )

    return c.json([governanceMosaic, ...pointMosaics.filter(Boolean)])
  } catch (error) {
    console.error("ポイント情報取得エラー:", error)
    return c.json(
      {
        message: "ポイント情報の取得に失敗しました",
      },
      500,
    )
  }
}
