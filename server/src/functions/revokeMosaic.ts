import { Address, descriptors, models } from "symbol-sdk/symbol"

// モザイクの回収
export const revokeMosaic = (
  mosaicId: string,
  sourceAddresses: string[],
  amount: number,
): descriptors.MosaicSupplyRevocationTransactionV1Descriptor[] => {
  // 回収対象アドレスごとにモザイク回収トランザクションを作成
  return sourceAddresses.map((address) => {
    const accountAddress = new Address(address)
    return new descriptors.MosaicSupplyRevocationTransactionV1Descriptor(
      accountAddress,
      new descriptors.UnresolvedMosaicDescriptor(
        new models.UnresolvedMosaicId(BigInt(`0x${mosaicId}`)),
        new models.Amount(BigInt(amount)),
      ),
    )
  })
}
