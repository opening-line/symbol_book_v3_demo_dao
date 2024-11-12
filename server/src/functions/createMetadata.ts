import { Address, descriptors } from "symbol-sdk/symbol"

export const createMetadata = (
  target: Address,
  key: bigint,
  value: Uint8Array,
) => {
  return new descriptors.AccountMetadataTransactionV1Descriptor(
    target,
    key,
    value.length,
    value,
  )
}
