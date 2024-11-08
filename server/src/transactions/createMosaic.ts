import {
  Address,
  descriptors,
  generateMosaicId,
  models,
  SymbolPublicAccount,
} from "symbol-sdk/symbol"
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
