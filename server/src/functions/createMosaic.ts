import { descriptors, models } from "symbol-sdk/symbol"
import { configureMosaicMetadata } from "./configureMetadata"

interface MosaicFlags {
  supplyMutable: boolean
  transferable: boolean
  restrictable: boolean
  revokable: boolean
}

/**
 * モザイクの作成
 * @param mosaicId モザイクID
 * @param nonce モザイクナンス
 * @param amount 供給量
 * @param flags モザイク設定
 * @returns モザイク定義トランザクションディスクリプタとモザイク供給量変更トランザクションディスクリプタ
 */
export const createMosaic = (
  mosaicId: bigint,
  nonce: number,
  amount: number,
  flags: MosaicFlags,
) => {
  const mosaicFlagsValue =
    (flags.supplyMutable ? models.MosaicFlags.SUPPLY_MUTABLE.value : 0) |
    (flags.transferable ? models.MosaicFlags.TRANSFERABLE.value : 0) |
    (flags.restrictable ? models.MosaicFlags.RESTRICTABLE.value : 0) |
    (flags.revokable ? models.MosaicFlags.REVOKABLE.value : 0)

  const mosaicDefinitionDescriptor =
    new descriptors.MosaicDefinitionTransactionV1Descriptor(
      new models.MosaicId(mosaicId), // モザイクID
      new models.BlockDuration(0n), // 有効期限
      new models.MosaicNonce(nonce), // モザイクナンス
      new models.MosaicFlags(mosaicFlagsValue), // モザイク設定
      0, // divisibility(可分性、小数点以下の桁数)
    )

  const mosaicSupplyChangeDescriptor =
    new descriptors.MosaicSupplyChangeTransactionV1Descriptor(
      new models.UnresolvedMosaicId(mosaicId), // モザイクID
      new models.Amount(BigInt(amount)), // 供給量
      models.MosaicSupplyChangeAction.INCREASE, // 供給量変更アクション（0: Decrease, 1: Increase）
    )

  return { mosaicDefinitionDescriptor, mosaicSupplyChangeDescriptor }
}

/**
 * ポイントモザイクの作成
 * @param mosaicId モザイクID
 * @param nonce モザイクナンス
 * @param amount 供給量
 * @param supplyMutable 供給量変更可否
 * @param mosaicName モザイク名
 * @param address モザイク作成者アドレス
 * @returns モザイク定義トランザクションディスクリプタとモザイク供給量変更トランザクションディスクリプタ
 */
export const createPointMosaic = async (
  mosaicId: bigint,
  nonce: number,
  amount: number,
  supplyMutable: boolean,
  mosaicName: string,
  address: string,
) => {
  const flags: MosaicFlags = {
    supplyMutable: supplyMutable,
    transferable: false,
    restrictable: false,
    revokable: true,
  }
  const { mosaicDefinitionDescriptor, mosaicSupplyChangeDescriptor } =
    createMosaic(mosaicId, nonce, amount, flags)

  // metadataでnameにmosaicNameを定義
  const configureMosaicNameMetadataDescriptor = await configureMosaicMetadata(
    "name",
    mosaicName,
    mosaicId.toString(),
    true,
    address,
  )

  // metadataでtypeにpointを定義
  const configureMosaicTypeMetadataDescriptor = await configureMosaicMetadata(
    "type",
    "point",
    mosaicId.toString(),
    true,
    address,
  )
  return {
    mosaicDefinitionDescriptor,
    mosaicSupplyChangeDescriptor,
    configureMosaicNameMetadataDescriptor,
    configureMosaicTypeMetadataDescriptor,
  }
}

/**
 * 特典モザイクの作成
 * @param mosaicId モザイクID
 * @param nonce モザイクナンス
 * @param amount 供給量
 * @param supplyMutable 供給量変更可否
 * @param mosaicName モザイク名
 * @param address モザイク作成者アドレス
 * @returns モザイク定義トランザクションディスクリプタとモザイク供給量変更トランザクションディスクリプタ
 */
export const createRewardMosaic = async (
  mosaicId: bigint,
  nonce: number,
  amount: number,
  supplyMutable: boolean,
  mosaicName: string,
  address: string,
) => {
  const flags: MosaicFlags = {
    supplyMutable: supplyMutable,
    transferable: false,
    restrictable: false,
    revokable: false,
  }
  const { mosaicDefinitionDescriptor, mosaicSupplyChangeDescriptor } =
    createMosaic(mosaicId, nonce, amount, flags)

  // metadataでnameにmosaicNameを定義
  const configureMosaicNameMetadataDescriptor = await configureMosaicMetadata(
    "name",
    mosaicName,
    mosaicId.toString(),
    true,
    address,
  )

  // metadataでtypeにrewardを定義
  const configureMosaicTypeMetadataDescriptor = await configureMosaicMetadata(
    "type",
    "reward",
    mosaicId.toString(),
    true,
    address,
  )
  return {
    mosaicDefinitionDescriptor,
    mosaicSupplyChangeDescriptor,
    configureMosaicNameMetadataDescriptor,
    configureMosaicTypeMetadataDescriptor,
  }
}
