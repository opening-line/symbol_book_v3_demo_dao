import { descriptors, models, type Address } from "symbol-sdk/symbol"
import { Config } from "../utils/config"

/**
 * XYMの送信
 * @param toAddress 送信先アドレス
 * @param amount 送信量
 * @returns 送信トランザクションディスクリプタ
 */
export const transferXym = (toAddress: Address, amount: bigint) => {
  return transfer(toAddress, Config.XYM_ID, amount)
}

/**
 * モザイクの送信
 * @param toAddress 送信先アドレス
 * @param mosaicId 送信するモザイクID
 * @param amount 送信量
 * @returns 送信トランザクションディスクリプタ
 */
export const transferMosaic = (
  toAddress: Address,
  mosaicId: bigint,
  amount: bigint,
) => {
  return transfer(toAddress, mosaicId, amount)
}

/**
 * 送信
 * @param toAddress 送信先アドレス
 * @param mosaicId 送信するモザイクID
 * @param amount 送信量
 * @param message メッセージ
 * @returns 送信トランザクションディスクリプタ
 */
export const transfer = (
  toAddress: Address,
  mosaicId: bigint,
  amount: bigint,
  message?: string,
) => {
  return new descriptors.TransferTransactionV1Descriptor(
    toAddress,
    [
      new descriptors.UnresolvedMosaicDescriptor(
        new models.UnresolvedMosaicId(mosaicId),
        new models.Amount(amount),
      ),
    ],
    message === undefined
      ? undefined
      : new Uint8Array([0x00, ...new TextEncoder().encode(message)]),
  )
}

/**
 * メッセージ送信
 * @param toAddress 送信先アドレス
 * @param message メッセージ
 * @returns 送信トランザクションディスクリプタ
 */
export const messaging = (toAddress: Address, message: string) => {
  return new descriptors.TransferTransactionV1Descriptor(
    toAddress,
    [],
    new Uint8Array([0x00, ...new TextEncoder().encode(message)]),
  )
}
