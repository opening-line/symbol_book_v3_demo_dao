import { Address, descriptors } from "symbol-sdk/symbol"

export const createDummy = (address: string) => {
  return new descriptors.TransferTransactionV1Descriptor(new Address(address))
}
