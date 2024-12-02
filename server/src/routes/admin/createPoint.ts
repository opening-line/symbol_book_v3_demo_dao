import type { Context } from "hono"
import { env } from "hono/adapter"
import { PrivateKey, PublicKey } from "symbol-sdk"
import { descriptors, models, SymbolFacade } from "symbol-sdk/symbol"
import { announceBonded } from "../../functions/announceBonded"
import { announceTransaction } from "../../functions/announceTransaction"
import { createDummy } from "../../functions/createDummy"
import { createHashLock } from "../../functions/createHashLock"
import { createPointMosaic } from "../../functions/createMosaic"
import { createMosaicId } from "../../functions/createMosaicId"
import { signTransaction } from "../../functions/signTransaction"
import { Config } from "../../utils/config"

export const createPoint = async (c: Context) => {
  const ENV = env<{ PRIVATE_KEY: string }>(c)

  const { id, mosaicName, amount } = (await c.req.json()) as {
    id: string
    mosaicName: string
    amount: string
  }

  const facade = new SymbolFacade(Config.NETWORK)
  const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
  const daoAccount = facade.createPublicAccount(new PublicKey(id))
  const mosaicIdInfo = createMosaicId(daoAccount.address)
  const pointMosaicDes = await createPointMosaic(
    mosaicIdInfo.id,
    mosaicIdInfo.nonce,
    Number(amount),
    false,
    mosaicName,
    daoAccount.address.toString(),
  )
  const txs = [
    {
      transaction: pointMosaicDes.mosaicDefinitionDescriptor,
      signer: daoAccount.publicKey,
    },
    {
      transaction: pointMosaicDes.mosaicSupplyChangeDescriptor,
      signer: daoAccount.publicKey,
    },
    {
      transaction: pointMosaicDes.configureMosaicNameMetadataDescriptor,
      signer: daoAccount.publicKey,
    },
    {
      transaction: pointMosaicDes.configureMosaicTypeMetadataDescriptor,
      signer: daoAccount.publicKey,
    },
  ]
  const mosaicCreateTxs = txs.map((tx) =>
    facade.createEmbeddedTransactionFromTypedDescriptor(
      tx.transaction,
      tx.signer,
    ),
  )

  const dummy = createDummy(daoAccount.address.toString())
  const dummyTx = facade.createEmbeddedTransactionFromTypedDescriptor(
    dummy,
    masterAccount.publicKey,
  )
  const innerTxs = [...mosaicCreateTxs, dummyTx]
  const txHash = SymbolFacade.hashEmbeddedTransactions(innerTxs)
  const aggregateDes = new descriptors.AggregateBondedTransactionV2Descriptor(
    txHash,
    innerTxs,
  )
  const mosaicCreateBondedTx = models.AggregateBondedTransactionV2.deserialize(
    facade
      .createTransactionFromTypedDescriptor(
        aggregateDes,
        masterAccount.publicKey,
        Config.FEE_MULTIPLIER,
        Config.DEADLINE_SECONDS,
      )
      .serialize(),
  )

  const signedBonded = signTransaction(masterAccount, mosaicCreateBondedTx)

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

  return c.json({ message: `ポイントモザイクの作成を実施しました。他の管理者による承認をお待ちください。` })
}
