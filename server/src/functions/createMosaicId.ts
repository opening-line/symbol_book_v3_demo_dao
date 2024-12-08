import { generateMosaicId, type Address } from "symbol-sdk/symbol"

/**
 * モザイクIDの作成
 * @param address モザイク作成者アドレス
 * @returns モザイクIDとモザイクナンス
 */
export const createMosaicId = (address: Address) => {
  const nonce = Math.floor(Math.random() * 0xffffffff)
  const id = generateMosaicId(address, nonce)
  return {
    id,
    nonce,
  }
}
