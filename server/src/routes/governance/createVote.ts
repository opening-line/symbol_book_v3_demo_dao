import type { Context } from "hono"
import { createMosaicId } from "../../functions/createMosaicId"
import { PrivateKey, PublicKey } from "symbol-sdk"
import { Address, SymbolFacade, descriptors, metadataUpdateValue, models } from "symbol-sdk/symbol"
import { Config } from "../../utils/config"
import { messaging, transferMosaic } from "../../functions/transfer"
import { env } from "hono/adapter"
import { createMosaic } from "../../functions/createMosaic"
import { getMosaicHolders } from "../../info/getAccountInfo"
import { getMetadataInfo } from "../../info/getMetadataInfo"
import { pickMetadata } from "../../functions/pickMetadata"
import { METADATA_KEYS } from "../../utils/metadataKeys"
import { decordHexAddress } from "../../functions/decordHexAddress"
import { createMetadata } from "../../functions/createMetadata"
import { createDummy } from "../../functions/createDummy"
import { anounceBonded } from "../../functions/anounceBonded"
import { createHashLock } from "../../functions/createHashLock"
import { anounceTransaction } from "../../functions/anounceTransaction"
import { signTransaction } from "../../functions/signTransaction"

export const createVote = async (c: Context) => {
  const { daoId, title, voteA, voteB, voteC, voteD } = (await c.req.json()) as {
    daoId: string
    title: string
    voteA: string
    voteB: string
    voteC: string
    voteD: string
  }

  const textDecoder = new TextDecoder()
  const ENV = env<{ PRIVATE_KEY: string }>(c)
  const facade = new SymbolFacade(Config.NETWORK)
  const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
  const daoAccount = facade.createPublicAccount(new PublicKey(daoId))

  const voteTokenId = createMosaicId(masterAccount.address)

  // TODO: Index情報
  const indexMessage = {
    version: "1.0.0",
    token: voteTokenId.id.toString(),
    title,
    a: voteA,
    b: voteB,
    c: voteC,
    d: voteD,
  }
  const indexDes = messaging(daoAccount.address, JSON.stringify(indexMessage))

  // TODO: ガバナンストークンのIDを取得
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
  // TODO: ガバナンストークンの所持量を取得
  const tokenHolders = await getMosaicHolders(`mosaicId=${tokenId}`)

  const data = tokenHolders
    .map((e: any) => {
      const address = decordHexAddress(e.account.address)
      return {
        address,
        amount: Number(
          e.account.mosaics
            .filter((m: any) => m.id === tokenId.toUpperCase())
            .map((m: any) => m.amount)[0],
        ),
      }
    })
    .filter(
      (e: { address: string; amount: number }) =>
        e.address !== daoAccount.address.toString(),
    )

  const tokenAmount = data.reduce(
    (acc: number, e: { amount: number }) => acc + e.amount,
    0,
  )

  // TODO: 投票トークンを作成
  const flags = {
    supplyMutable: false,
    transferable: true,
    restrictable: true,
    revokable: true,
  }

  const createVoteTokenDes = createMosaic(
    voteTokenId.id,
    voteTokenId.nonce,
    tokenAmount,
    flags,
  )

  // TODO: 投票トークンを配布
  const transferDess: descriptors.TransferTransactionV1Descriptor[] = data.map(
    (e: { address: string; amount: number }) =>
      transferMosaic(new Address(e.address), voteTokenId.id, BigInt(e.amount)),
  )

  const txs = [
    {
      transaction: indexDes,
      signer: masterAccount.publicKey,
    },
    {
      transaction: createVoteTokenDes.mosaicDefinitionDescriptor,
      signer: masterAccount.publicKey,
    },
    {
      transaction: createVoteTokenDes.mosaicSupplyChangeDescriptor,
      signer: masterAccount.publicKey,
    },
    ...transferDess.map((tx) => {
      return {
        transaction: tx,
        signer: masterAccount.publicKey,
      }
    }),
  ]

  const innerTransactions = txs.map((tx) =>
    facade.createEmbeddedTransactionFromTypedDescriptor(
      tx.transaction,
      tx.signer,
    ),
  )

  const txHash = SymbolFacade.hashEmbeddedTransactions(innerTransactions)
  const aggregateDes = new descriptors.AggregateCompleteTransactionV2Descriptor(
    txHash,
    innerTransactions,
  )
  const tx = facade.createTransactionFromTypedDescriptor(
    aggregateDes,
    masterAccount.publicKey,
    Config.FEE_MULTIPLIER,
    Config.DEADLINE_SECONDS,
  )

  const announcedTx = await anounceTransaction(masterAccount, tx)

  await new Promise((resolve) => setTimeout(resolve, 1000))

  const dummyDes = createDummy(daoAccount.address.toString())

  const textEncoder = new TextEncoder()
  const metadataDes = createMetadata(
    daoAccount.address,
    BigInt(100 + mdRes.length - 7), // 100 + metadata length - default metadata
    metadataUpdateValue(textEncoder.encode(""), textEncoder.encode(announcedTx.hash.toString()))
  )

  const inTxs = [
    facade.createEmbeddedTransactionFromTypedDescriptor(
      dummyDes,
      masterAccount.publicKey,
    ),
    facade.createEmbeddedTransactionFromTypedDescriptor(
      metadataDes,
      daoAccount.publicKey,
    ),
  ]

  // TODO: アグリゲート
  const agtxHash = SymbolFacade.hashEmbeddedTransactions(inTxs)
  const agDes = new descriptors.AggregateBondedTransactionV2Descriptor(
    agtxHash,
    inTxs,
  )
  const bondedTx = models.AggregateBondedTransactionV2.deserialize(
    facade
      .createTransactionFromTypedDescriptor(
        agDes,
        masterAccount.publicKey,
        Config.FEE_MULTIPLIER,
        Config.DEADLINE_SECONDS,
      )
      .serialize(),
  )

  const signedBonded = signTransaction(masterAccount, bondedTx)

  // TODO: HashLock
  const hashLock = createHashLock(signedBonded.hash)
  const hashLockTransaction = facade.createTransactionFromTypedDescriptor(
    hashLock,
    masterAccount.publicKey,
    Config.FEE_MULTIPLIER,
    Config.DEADLINE_SECONDS,
  )

  const announcedHashLockTx = await anounceTransaction(
    masterAccount,
    hashLockTransaction,
  )

  await new Promise((resolve) => setTimeout(resolve, 1000))

  anounceBonded(
    announcedHashLockTx.hash.toString(),
    signedBonded.jsonPayload,
  ).catch(() => {
    console.error("hash lock error")
  })

  return c.json({ message: "Hello, World!" })
}
