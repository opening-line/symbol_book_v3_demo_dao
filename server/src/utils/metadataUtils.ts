import { metadataGenerateKey } from "symbol-sdk/symbol"
import { convertToMosaicActualAmount } from "./mosaicUtils"
import { pickMetadata } from "../functions/pickMetadata"
import { getMosaicInfo } from "../info/getMosaicInfo"

type Metadata = {
  key: string
  value: string
}

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

export const decodeMetadataValue = (value: string) =>
  new TextDecoder().decode(Buffer.from(value, "hex"))

export const encodeValue = (value: string) =>
  Buffer.from(new TextEncoder().encode(value)).toString("hex").toUpperCase()

/**
 * メタデータのタイプをチェックする関数
 * @param metadata メタデータ
 * @param type チェックするタイプ
 * @returns タイプが一致したかどうか
 */
export const checkMetadataType = (metadata: Metadata[], type: string) => {
  const res = pickMetadata(metadata, metadataGenerateKey("type"))
  return res?.value === type
}

/**
 * モザイク名を取得する関数
 * @param metadatas メタデータ
 * @param mosaicId モザイクID
 * @returns モザイク名
 */
export const getNameFromMetadata = (
  metadatas: Metadata[],
  mosaicId: string,
) => {
  const nameMetadata = pickMetadata(metadatas, metadataGenerateKey("name"))
  return nameMetadata ? nameMetadata.value : mosaicId
}

/**
 * モザイク情報を取得する共通関数
 * @param mosaic モザイク
 * @param metadata メタデータ
 * @returns モザイク情報
 */
export const fetchMosaicData = async (
  mosaic: Mosaic,
  metadata?: Metadata[],
): Promise<MosaicData | null> => {
  try {
    const mosaicInfo = await getMosaicInfo(mosaic.id)
    return {
      id: mosaic.id,
      maxSupply: mosaicInfo.supply.toString(),
      balance: convertToMosaicActualAmount(
        Number(mosaic.amount),
        mosaicInfo.divisibility,
      ),
      ...(metadata && { name: getNameFromMetadata(metadata, mosaic.id) }),
    }
  } catch (error) {
    console.error(`モザイク情報取得エラー: ${mosaic.id}`, error)
    return null
  }
}
