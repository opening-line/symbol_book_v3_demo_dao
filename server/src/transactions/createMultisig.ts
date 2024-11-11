import { Address, descriptors } from "symbol-sdk/symbol"

export const createMultisig = (cosignatories: Address[]) => {
  const cosignatoriesCount = cosignatories.length
  return new descriptors.MultisigAccountModificationTransactionV1Descriptor(
    cosignatoriesCount,
    cosignatoriesCount,
    cosignatories,
    [],
  )
}
