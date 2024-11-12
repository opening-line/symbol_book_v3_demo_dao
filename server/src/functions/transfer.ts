import { descriptors, type Address } from "symbol-sdk/symbol"
import { Config } from "../utils/config"
import { models } from "symbol-sdk/symbol"

export const transferXym = (toAddress: Address, amount: bigint) => {
  return transfer(toAddress, Config.XYM_ID, amount)
}

export const transferMosaic = (toAddress: Address, mosaicId: bigint, amount: bigint) => {
  return transfer(toAddress, mosaicId, amount)
}

export const transfer = (toAddress: Address, mosaicId: bigint, amount: bigint, message?: string) => {
    return new descriptors.TransferTransactionV1Descriptor(toAddress, [
      new descriptors.UnresolvedMosaicDescriptor(
        new models.UnresolvedMosaicId(mosaicId),
        new models.Amount(amount),
      )
    ],
    new Uint8Array([
      0x00,
      ...new TextEncoder().encode(message),
    ])
  )
}
