import type { Hash256 } from "symbol-sdk"
import { descriptors, models } from "symbol-sdk/symbol"
import { Config } from "../utils/config"

export const createHashLock = (txHash: Hash256) => {
  return new descriptors.HashLockTransactionV1Descriptor(
    new descriptors.UnresolvedMosaicDescriptor(
      new models.UnresolvedMosaicId(Config.XYM_ID),
      new models.Amount(10000000n),
    ),
    new models.BlockDuration(5760n),
    txHash,
  )
}
