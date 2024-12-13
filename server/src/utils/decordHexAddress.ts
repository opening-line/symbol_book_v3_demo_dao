import { utils } from "symbol-sdk"
import { Address, models } from "symbol-sdk/symbol"

/**
 * 16進数アドレスのデコード
 * @param hexAddress 16進数アドレス
 * @returns デコードされたアドレス
 */
export const decordHexAddress = (hexAddress: string) => {
  return new Address(
    new models.UnresolvedAddress(utils.hexToUint8(hexAddress)).bytes,
  ).toString()
}
