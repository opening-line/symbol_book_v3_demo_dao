import type { Context } from "hono"
import { env } from "hono/adapter"
import { PrivateKey, PublicKey } from "symbol-sdk"
import { descriptors, models, SymbolFacade } from "symbol-sdk/symbol"
import { announceBonded } from "../../functions/announceBonded"
import { announceTransaction } from "../../functions/announceTransaction"
import { createDummy } from "../../functions/createDummy"
import { createHashLock } from "../../functions/createHashLock"
import { revokeMosaic } from "../../functions/revokeMosaic"
import { signTransaction } from "../../functions/signTransaction"
import { Config } from "../../utils/config"

/**
 * ポイントモザイクを回収する
 */
export const revokePoint = async (c: Context) => {
  const ENV = env<{ PRIVATE_KEY: string }>(c)

  const { id, mosaicId, sourceAddresses, amount } =
    (await c.req.json()) as {
      id: string
      mosaicId: string
      sourceAddresses: string[]
      amount: string
    }

  const facade = new SymbolFacade(Config.NETWORK)
  const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
  const daoAccount = facade.createPublicAccount(new PublicKey(id))

  const revokeDes = revokeMosaic(
    mosaicId,
    sourceAddresses,
    Number(amount),
  )
  const revokeTxs = revokeDes.map((des) =>
    facade.createEmbeddedTransactionFromTypedDescriptor(
      des,
      daoAccount.publicKey,
    ),
  )

  const dummy = createDummy(daoAccount.address.toString())
  const dummyTx = facade.createEmbeddedTransactionFromTypedDescriptor(
    dummy,
    masterAccount.publicKey,
  )
  const innerTx = [...revokeTxs, dummyTx]
  const txHash = SymbolFacade.hashEmbeddedTransactions(innerTx)
  const aggregateDes = new descriptors.AggregateBondedTransactionV2Descriptor(
    txHash,
    innerTx,
  )
  const mosaicRevokeBondedTx = models.AggregateBondedTransactionV2.deserialize(
    facade
      .createTransactionFromTypedDescriptor(
        aggregateDes,
        masterAccount.publicKey,
        Config.FEE_MULTIPLIER,
        Config.DEADLINE_SECONDS,
      )
      .serialize(),
  )

  const signedBonded = signTransaction(masterAccount, mosaicRevokeBondedTx)

  const hashLock = createHashLock(signedBonded.hash)
  const hashLockTx = facade.createTransactionFromTypedDescriptor(
    hashLock,
    masterAccount.publicKey,
    Config.FEE_MULTIPLIER,
    Config.DEADLINE_SECONDS,
  )

  const announcedHashLock = await announceTransaction(
    masterAccount,
    hashLockTx,
  )
  await announceBonded(
    announcedHashLock.hash.toString(),
    signedBonded.jsonPayload,
  ).catch(() => {
    console.error("hash lock error")
  })

  return c.json({ message: `ポイントモザイクの回収を実施しました。他の管理者による承認をお待ちください。` })
}
