import {
  Address,
  descriptors,
  metadataGenerateKey,
  models,
} from "symbol-sdk/symbol"

export const createMosaicAddressRestriction = (
  mosaicId: bigint,
  address: string,
) => {
  const key = metadataGenerateKey("KYC")
  return new descriptors.MosaicAddressRestrictionTransactionV1Descriptor(
    new models.MosaicId(mosaicId),
    key,
    0n,
    1n,
    new Address(address),
  )
}
