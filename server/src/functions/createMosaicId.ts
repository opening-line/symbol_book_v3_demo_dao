import { generateMosaicId, type Address } from "symbol-sdk/symbol"

export const createMosaicId = (address: Address) => {
  const nonce = Math.floor(Math.random() * 0xffffffff)
  const id = generateMosaicId(address, nonce)
  return {
    id,
    nonce,
  }
}
