import { Address, descriptors } from "symbol-sdk/symbol"

/**
 * マルチシグアカウントの追加
 * @param cosignatories 追加する連署者
 * @returns マルチシグアカウント変更でトランザクションディスクリプタ
 */
export const addMultisig = (cosignatories: Address[]) => {
  const cosignatoriesCount = cosignatories.length
  return new descriptors.MultisigAccountModificationTransactionV1Descriptor(
    cosignatoriesCount,
    cosignatoriesCount,
    cosignatories,
    [],
  )
}
