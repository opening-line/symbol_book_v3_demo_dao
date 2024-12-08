import type { Context } from "hono"
import { PublicKey } from "symbol-sdk"
import { metadataGenerateKey, SymbolFacade } from "symbol-sdk/symbol"
import { getAccountInfo } from "../../info/getAccountInfo"
import { getMetadataInfo } from "../../info/getMetadataInfo"
import { getMosaicInfo } from "../../info/getMosaicInfo"
import { Config } from "../../utils/config"
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
const generateMetadataKey = (key: string) => metadataGenerateKey(key).toString(16).toUpperCase()
const decodeMetadataValue = (value: string) => new TextDecoder().decode(Buffer.from(value, 'hex'))
const encodeValue = (value: string) => Buffer.from(new TextEncoder().encode(value)).toString('hex').toUpperCase()

const getNameFromMetadata = (mosaicId: string, metadata: MetadataEntry[]) => {
  const nameMetadata = metadata.find(
    (e: MetadataEntry) => e.metadataEntry.scopedMetadataKey === generateMetadataKey("name")
  )
  return nameMetadata ? decodeMetadataValue(nameMetadata.metadataEntry.value) : mosaicId
}

const isRewardMosaicType = (metadata: MetadataEntry[]) => {
  return metadata.some(
    (e: MetadataEntry) =>
      e.metadataEntry.scopedMetadataKey === generateMetadataKey("type") &&
      e.metadataEntry.value === encodeValue("reward")
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
 * DAOが発行した特典モザイク情報を取得する
 */
export const getRewardInfo = async (c: Context) => {
  try {
    const id = c.req.param("id")
    const facade = new SymbolFacade(Config.NETWORK)
    const daoAccount = facade.createPublicAccount(new PublicKey(id))
    const address = daoAccount.address.toString()

    // アカウント情報の取得
    const accountInfo = await getAccountInfo(address)

    // 全モザイクのメタデータを一括取得
    const mosaicMetadatas = await Promise.all([
      ...accountInfo.mosaics.map((mosaic: Mosaic) => getMetadataInfo(`targetId=${mosaic.id}`))
    ])

    // 特典モザイクの処理
    const rewardMosaics = await Promise.all(
      accountInfo.mosaics.map(async (mosaic: Mosaic, index: number) => {
        try {
          const metadata = mosaicMetadatas[index]
          if (!isRewardMosaicType(metadata)) {
            return null
          }

          return {
            ...(await fetchMosaicData(mosaic)),
            name: getNameFromMetadata(mosaic.id, metadata)
          }
        } catch (error) {
          console.error(`メタデータ取得エラー: ${mosaic.id}`, error)
          return null
        }
      })
    )

    return c.json(rewardMosaics.filter(Boolean))
  } catch (error) {
    console.error('特典情報取得エラー:', error)
    return c.json({
      message: "特典情報の取得に失敗しました",
    }, 500)
  }
}
