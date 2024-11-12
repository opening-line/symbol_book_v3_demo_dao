import { Address, descriptors } from "symbol-sdk/symbol"

export const addMultisig = (cosignatories: Address[]) => {
  const cosignatoriesCount = cosignatories.length
  return new descriptors.MultisigAccountModificationTransactionV1Descriptor(
    cosignatoriesCount,
    cosignatoriesCount,
    cosignatories,
    [],
  )
}
