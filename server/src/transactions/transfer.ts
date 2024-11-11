import { descriptors, type Address } from "symbol-sdk/symbol"
import { Config } from "../utils/config"
import { models } from "symbol-sdk/symbol"

export const transferXym = (toAddress: Address, amount: bigint) => {
  return new descriptors.TransferTransactionV1Descriptor(toAddress, [
    new descriptors.UnresolvedMosaicDescriptor(
      new models.UnresolvedMosaicId(Config.XYM_ID),
      new models.Amount(amount),
    ),
  ])
}
