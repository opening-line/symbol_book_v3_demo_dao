import type { Context } from "hono"
import { PrivateKey, PublicKey } from "symbol-sdk"
import { Address, descriptors, models, SymbolFacade } from "symbol-sdk/symbol"
import { Config } from "../../utils/config"
import { createDummy } from "../../functions/createDummy"
import { env } from "hono/adapter"
import { deleteMultisig } from "../../functions/deleteMultisig"
import { createHashLock } from "../../functions/createHashLock"
import { announceBonded } from "../../functions/announceBonded"
import { announceTransaction } from "../../functions/announceTransaction"
import { signTransaction } from "../../functions/signTransaction"

export const deleteAdmin = async (c: Context) => {
  const { daoId, addresses } = (await c.req.json()) as {
    daoId: string
    addresses: string[]
  }

  const ENV = env<{ PRIVATE_KEY: string }>(c)
  const facade = new SymbolFacade(Config.NETWORK)
  const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
  // Add admin to DAO

  const daoAccount = facade.createPublicAccount(new PublicKey(daoId))

  const deleteAdmins = addresses.map((address) => new Address(address))

  const daoAccountMultisig = deleteMultisig(deleteAdmins)

  const multisigTransaction =
    facade.createEmbeddedTransactionFromTypedDescriptor(
      daoAccountMultisig,
      daoAccount.publicKey,
    )

  const dummy = createDummy(daoAccount.address.toString())
  const dummyTransaction = facade.createEmbeddedTransactionFromTypedDescriptor(
    dummy,
    masterAccount.publicKey,
  )
  const innerTransactions = [multisigTransaction, dummyTransaction]

  // TODO: アグリゲート
  const txHash = SymbolFacade.hashEmbeddedTransactions(innerTransactions)
  const aggregateDes = new descriptors.AggregateBondedTransactionV2Descriptor(
    txHash,
    innerTransactions,
  )
  const tx = models.AggregateBondedTransactionV2.deserialize(
    facade
      .createTransactionFromTypedDescriptor(
        aggregateDes,
        masterAccount.publicKey,
        Config.FEE_MULTIPLIER,
        Config.DEADLINE_SECONDS,
      )
      .serialize(),
  )

  const signedBonded = signTransaction(masterAccount, tx)

  // TODO: HashLock
  const hashLock = createHashLock(signedBonded.hash)
  const hashLockTransaction = facade.createTransactionFromTypedDescriptor(
    hashLock,
    masterAccount.publicKey,
    Config.FEE_MULTIPLIER,
    Config.DEADLINE_SECONDS,
  )

  const announcedHashLockTx = await announceTransaction(
    masterAccount,
    hashLockTransaction,
  )

  // await new Promise((resolve) => setTimeout(resolve, 1000))

  announceBonded(
    announcedHashLockTx.hash.toString(),
    signedBonded.jsonPayload,
  ).catch(() => {
    console.error("hash lock error")
  })

  return c.json({ message: "Hello deleteAdmin" })
}
