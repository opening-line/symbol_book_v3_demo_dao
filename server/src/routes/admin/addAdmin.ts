import type { Context } from "hono"
import { PrivateKey, PublicKey } from "symbol-sdk"
import { Address, descriptors, models, SymbolFacade } from "symbol-sdk/symbol"
import { Config } from "../../utils/config"
import { addMultisig } from "../../functions/addMultisig"
import { createDummy } from "../../functions/createDummy"
import { env } from "hono/adapter"
import { createHashLock } from "../../functions/createHashLock"
import { anounceBonded } from "../../functions/anounceBonded"
import { anounceTransaction } from "../../functions/anounceTransaction"
import { signTransaction } from "../../functions/signTransaction"

export const addAdmin = async (c: Context) => {
  const { daoId, addresses } = (await c.req.json()) as {
    daoId: string
    addresses: string[]
  }

  const ENV = env<{ PRIVATE_KEY: string }>(c)
  const facade = new SymbolFacade(Config.NETWORK)
  const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
  // Add admin to DAO

  const daoAccount = facade.createPublicAccount(new PublicKey(daoId))

  const newAdmins = addresses.map((address) => new Address(address))

  const daoAccountMultisig = addMultisig(newAdmins)

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

  const anouncedHashLockTx = await anounceTransaction(masterAccount, hashLockTransaction)

  anounceBonded(anouncedHashLockTx.hash.toString(), signedBonded.jsonPayload)
    .catch(() => {
      console.error("hash lock error")
    })

  return c.json({ message: "Hello addAdmin" })
}
