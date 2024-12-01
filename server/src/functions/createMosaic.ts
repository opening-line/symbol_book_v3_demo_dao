import { descriptors, models } from "symbol-sdk/symbol"
import { configureMosaicMetadata } from "./configureMetadata"

interface MosaicFlags {
  supplyMutable: boolean
  transferable: boolean
  restrictable: boolean
  revokable: boolean
}

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

  // モザイク定義トランザクションの作成
  const mosaicDefinitionDescriptor =
    new descriptors.MosaicDefinitionTransactionV1Descriptor(
      new models.MosaicId(mosaicId), // モザイクID
      new models.BlockDuration(0n), // 有効期限
      new models.MosaicNonce(nonce), // モザイクナンス
      new models.MosaicFlags(mosaicFlagsValue), // モザイク設定
      0, // divisibility(過分性、小数点以下の桁数)
    )

  // モザイク供給量変更トランザクションの作成
  const mosaicSupplyChangeDescriptor =
    new descriptors.MosaicSupplyChangeTransactionV1Descriptor(
      new models.UnresolvedMosaicId(mosaicId), // モザイクID
      new models.Amount(BigInt(amount)), // 供給量
      models.MosaicSupplyChangeAction.INCREASE, // 供給量変更アクション（0: Decrease, 1: Increase）
    )

  return { mosaicDefinitionDescriptor, mosaicSupplyChangeDescriptor }
}

export const createGovToken = (
  mosaicId: bigint,
  nonce: number,
  amount: number,
  supplyMutable: boolean,
  mosaicName: string,
  address: string,
) => {
  const flags: MosaicFlags = {
    supplyMutable: supplyMutable,
    transferable: true,
    restrictable: false,
    revokable: true,
  }
  // モザイク定義トランザクションの作成
  const mosaicDefinitionDescriptor = createMosaic(
    mosaicId,
    nonce,
    amount,
    flags,
  )
  // metadataでmosaicNameを定義
  const configureMosaicMetadataDescriptor = configureMosaicMetadata(
    "name",
    mosaicName,
    mosaicId.toString(),
    true,
    address,
  )
  return { mosaicDefinitionDescriptor, configureMosaicMetadataDescriptor }
}

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
  // モザイク定義トランザクションの作成
  const { mosaicDefinitionDescriptor, mosaicSupplyChangeDescriptor } =
    createMosaic(mosaicId, nonce, amount, flags)

  // metadataでmosaicNameを定義
  const configureMosaicNameMetadataDescriptor = await configureMosaicMetadata(
    "name",
    mosaicName,
    mosaicId.toString(),
    true,
    address,
  )

  // metadataでtype: pointを定義
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
  // モザイク定義トランザクションの作成
  const { mosaicDefinitionDescriptor, mosaicSupplyChangeDescriptor } =
    createMosaic(mosaicId, nonce, amount, flags)

  // metadataでmosaicNameを定義
  const configureMosaicNameMetadataDescriptor = await configureMosaicMetadata(
    "name",
    mosaicName,
    mosaicId.toString(),
    true,
    address,
  )

  // metadataでtype: rewardを定義
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
