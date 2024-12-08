import {
  Address,
  descriptors,
  metadataGenerateKey,
  metadataUpdateValue,
  models,
} from "symbol-sdk/symbol"
import { getMetadataInfoByQuery } from "../info/getMetadataInfoByQuery"
import { getMosaicInfo } from "../info/getMosaicInfo"

/**
 * アカウントメタデータの設定
 * @param metadataKey メタデータキー
 * @param metadataValue メタデータ値
 * @param sourceAddress メタデータ設定を実行するアドレス
 * @param targetAddress メタデータ設定先アドレス
 * @returns アカウントメタデータトランザクションディスクリプタ
 */
export const configureAccountMetadata = async (
  metadataKey: string,
  metadataValue: string,
  sourceAddress: string,
  targetAddress: string,
): Promise<descriptors.AccountMetadataTransactionV1Descriptor> => {
  try {
    // キーと値の設定
    const key = metadataGenerateKey(metadataKey)
    let value = new TextEncoder().encode(metadataValue)
    let valueSizeDelta = value.length
    // 対象アカウントの既存メタデータ値を取得
    const query = new URLSearchParams({
      targetAddress: targetAddress,
      sourceAddress: sourceAddress,
      scopedMetadataKey: key.toString(16).toUpperCase(),
      metadataType: "0",
    })
    const existingAccountMetadataInfo = await getMetadataInfoByQuery(query.toString())

    // 既に登録済みの場合は差分データを作成
    if (existingAccountMetadataInfo.length > 0) {
      valueSizeDelta -= existingAccountMetadataInfo[0].metadata.valueSizeDelta
      value = metadataUpdateValue(
        existingAccountMetadataInfo[0].metadata.value,
        value,
      )
    }
    // アカウントメタデータ登録トランザクションの作成
    const accountMetadataTransactionDescriptor =
      new descriptors.AccountMetadataTransactionV1Descriptor(
        new Address(targetAddress),
        key,
        valueSizeDelta,
        value,
      )

    return accountMetadataTransactionDescriptor
  } catch (error) {
    console.error("アカウントメタデータ設定中にエラーが発生しました: ", error)
    throw error
  }
}

/**
 * モザイクメタデータの設定
 * @param metadataKey メタデータキー
 * @param metadataValue メタデータ値
 * @param targetMosaicId メタデータ設定先モザイクID
 * @param isCreate モザイク新規作成フラグ
 * @param mosaicCreatorAddress モザイク作成者アドレス
 * @returns モザイクメタデータトランザクションディスクリプタ
 */
export const configureMosaicMetadata = async (
  metadataKey: string,
  metadataValue: string,
  targetMosaicId: string,
  isCreate: boolean,
  mosaicCreatorAddress: string,
): Promise<descriptors.MosaicMetadataTransactionV1Descriptor> => {
  try {
    // キーと値の設定
    const key = metadataGenerateKey(metadataKey)
    let value = new TextEncoder().encode(metadataValue)
    let valueSizeDelta = value.length

    // モザイク新規作成時以外は既存メタデータの値を取得
    if (!isCreate) {
      // 対象モザイクの既存メタデータを取得
      const mosaicInfo = await getMosaicInfo(targetMosaicId.toUpperCase())
      mosaicCreatorAddress = mosaicInfo.mosaic?.ownerAddress

      // 既存モザイクメタデータの値を取得
      const query = new URLSearchParams({
        targetId: targetMosaicId.toUpperCase(),
        sourceAddress: mosaicCreatorAddress.toString(),
        scopedMetadataKey: key.toString(16).toUpperCase(),
        metadataType: "1",
      })
      const existingMosaicMetadataInfo = await getMetadataInfoByQuery(query.toString())

      // 既に登録済みの場合は差分データを作成
      if (existingMosaicMetadataInfo.length > 0) {
        valueSizeDelta -= existingMosaicMetadataInfo[0].metadataEntry.valueSize
        value = metadataUpdateValue(
          existingMosaicMetadataInfo[0].metadataEntry.value,
          value,
        )
      }
    }

    // モザイクメタデータ登録トランザクションの作成
    const mosaicMetadataTransactionDescriptor =
      new descriptors.MosaicMetadataTransactionV1Descriptor(
        new Address(mosaicCreatorAddress),
        key,
        new models.UnresolvedMosaicId(BigInt(targetMosaicId)),
        valueSizeDelta,
        value,
      )

    return mosaicMetadataTransactionDescriptor
  } catch (error) {
    console.error("モザイクメタデータ設定中にエラーが発生しました: ", error)
    throw error
  }
}
