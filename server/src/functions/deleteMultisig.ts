import { Address, descriptors } from "symbol-sdk/symbol"

/**
 * マルチシグアカウントの削除
 * @param cosignatories 削除する連署者
 * @returns マルチシグアカウント変更トランザクションディスクリプタ
 */
export const deleteMultisig = (cosignatories: Address[]) => {
  const cosignatoriesCount = cosignatories.length
  return new descriptors.MultisigAccountModificationTransactionV1Descriptor(
    cosignatoriesCount * -1,
    cosignatoriesCount * -1,
    [],
    cosignatories,
  )
}
