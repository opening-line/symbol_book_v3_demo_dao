import { Address, descriptors } from "symbol-sdk/symbol"

/**
 * ダミートランザクションの作成
 * masterAccountがトランザクション手数料を肩代わりするために追加するトランザクション
 * @param address 送信アドレス
 * @returns 送信トランザクションディスクリプタ
 */
export const createDummy = (address: string) => {
  return new descriptors.TransferTransactionV1Descriptor(new Address(address))
}
