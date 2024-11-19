import type { Context } from "hono"
import { PrivateKey, PublicKey } from "symbol-sdk"
import { Address, descriptors, models, SymbolFacade } from "symbol-sdk/symbol"
import { Config } from "../../utils/config"
import { createDummy } from "../../functions/createDummy"
import { env } from "hono/adapter"
import { deleteMultisig } from "../../functions/deleteMultisig"
import { createHashLock } from "../../functions/createHashLock"
import { awaitHashLock } from "../../functions/awaitHashLock"

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

  const signatureMaster = masterAccount.signTransaction(tx)

  const jsonPayload = facade.transactionFactory.static.attachSignature(
    tx,
    signatureMaster,
  )

  const hashAgg = facade.hashTransaction(tx)

  // TODO: HashLock
  const hashLock = createHashLock(hashAgg)
  const hashLockTransaction = facade.createTransactionFromTypedDescriptor(
    hashLock,
    masterAccount.publicKey,
    Config.FEE_MULTIPLIER,
    Config.DEADLINE_SECONDS,
  )

  const signatureMasterHashLock =
    masterAccount.signTransaction(hashLockTransaction)

  const jsonPayloadHashLock = facade.transactionFactory.static.attachSignature(
    hashLockTransaction,
    signatureMasterHashLock,
  )

  const hashHL = facade.hashTransaction(hashLockTransaction)

  const sendRes = await fetch(new URL("/transactions", Config.NODE_URL), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: jsonPayloadHashLock,
  }).then((res) => res.json())
  console.log(sendRes)

  await new Promise((resolve) => setTimeout(resolve, 1000))

  awaitHashLock(hashHL.toString())
    .then(async () => {
      const sendAggRes = await fetch(
        new URL("/transactions/partial", Config.NODE_URL),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: jsonPayload,
        },
      ).then((res) => res.json())
      console.log(sendAggRes)
    })
    .catch(() => {
      console.error("hash lock error")
    })

  return c.json({ message: "Hello deleteAdmin" })
}
