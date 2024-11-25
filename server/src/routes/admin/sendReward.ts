import type { Context } from "hono"
import { transfer } from "../../functions/transfer"
import { Address, descriptors, models, SymbolFacade } from "symbol-sdk/symbol"
import { getMetadataInfo } from "../../info/getMetadataInfo"
import { METADATA_KEYS } from "../../utils/metadataKeys"
import { Config } from "../../utils/config"
import { env } from "hono/adapter"
import { PrivateKey, PublicKey } from "symbol-sdk"
import { createDummy } from "../../functions/createDummy"
import { createHashLock } from "../../functions/createHashLock"
import { awaitHashLock } from "../../functions/awaitHashLock"
import { pickMetadata } from "../../functions/pickMetadata"

export const sendReward = async (c: Context) => {
  const ENV = env<{ PRIVATE_KEY: string }>(c)

  const { daoId, to, amount, message } = (await c.req.json()) as {
    daoId: string
    to: string
    amount: string
    message: string
  }

  const facade = new SymbolFacade(Config.NETWORK)
  const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
  const daoAccount = facade.createPublicAccount(new PublicKey(daoId))
  const textDecoder = new TextDecoder()
  const address = new Address(to)

  const mdRes = await getMetadataInfo(
    `targetAddress=${daoAccount.address.toString()}`,
  )
  const metadatas = mdRes.map(
    (e: { metadataEntry: { scopedMetadataKey: string; value: string } }) => {
      return {
        key: e.metadataEntry.scopedMetadataKey,
        value: textDecoder.decode(
          Uint8Array.from(Buffer.from(e.metadataEntry.value, "hex")),
        ),
      }
    },
  )

  const tokenId = pickMetadata(
    metadatas,
    METADATA_KEYS.GOVERNANCE_TOKEN_ID,
  ).value

  const transferDes = transfer(
    address,
    BigInt(`0x${tokenId}`),
    BigInt(amount),
    message,
  )
  const transferTransaction =
    facade.createEmbeddedTransactionFromTypedDescriptor(
      transferDes,
      daoAccount.publicKey,
    )

  const dummy = createDummy(daoAccount.address.toString())
  const dummyTransaction = facade.createEmbeddedTransactionFromTypedDescriptor(
    dummy,
    masterAccount.publicKey,
  )
  const innerTransactions = [transferTransaction, dummyTransaction]

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

  return c.json({ message: "sendReward" })
}
