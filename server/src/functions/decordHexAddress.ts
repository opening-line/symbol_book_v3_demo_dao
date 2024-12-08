import { utils } from "symbol-sdk"
import { Address, models } from "symbol-sdk/symbol"

export const decordHexAddress = (hexAddress: string) => {
  return new Address(
    new models.UnresolvedAddress(utils.hexToUint8(hexAddress)).bytes,
  ).toString()
}
