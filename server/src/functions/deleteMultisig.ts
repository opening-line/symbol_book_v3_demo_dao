import { Address, descriptors } from "symbol-sdk/symbol"

export const deleteMultisig = (cosignatories: Address[]) => {
  const cosignatoriesCount = cosignatories.length
  return new descriptors.MultisigAccountModificationTransactionV1Descriptor(
    cosignatoriesCount * -1,
    cosignatoriesCount * -1,
    [],
    cosignatories,
  )
}
