import type { Context } from "hono"
import { env } from "hono/adapter"
import { PrivateKey, PublicKey } from "symbol-sdk"
import {
  Address,
  SymbolFacade,
  descriptors,
  metadataUpdateValue,
  models,
} from "symbol-sdk/symbol"
import { announceBonded } from "../../functions/announceBonded"
import { announceTransaction } from "../../functions/announceTransaction"
import { createAccountMetadata } from "../../functions/createAccountMetadata"
import { createDummy } from "../../functions/createDummy"
import { createHashLock } from "../../functions/createHashLock"
import { createMosaic } from "../../functions/createMosaic"
import { createMosaicId } from "../../functions/createMosaicId"
import { pickMetadata } from "../../functions/pickMetadata"
import { signTransaction } from "../../functions/signTransaction"
import { messaging, transferMosaic } from "../../functions/transfer"
import { getMosaicHolders } from "../../info/getAccountInfo"
import { getMetadataInfoByQuery } from "../../info/getMetadataInfoByQuery"
import { Config } from "../../utils/config"
import { decordHexAddress } from "../../utils/decordHexAddress"
import { METADATA_KEYS } from "../../utils/metadataKeys"

type MetadataEntry = {
  metadataEntry: {
    scopedMetadataKey: string
    value: string
  }
}

export const createVote = async (c: Context) => {
  try {
    const ENV = env<{ PRIVATE_KEY: string }>(c)

    const { daoId, title, voteA, voteB, voteC, voteD } = (await c.req.json()) as {
      daoId: string
      title: string
      voteA: string
      voteB: string
      voteC: string
      voteD: string
    }

    const textDecoder = new TextDecoder()
    const textEncoder = new TextEncoder()
    const facade = new SymbolFacade(Config.NETWORK)
    const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
    const daoAccount = facade.createPublicAccount(new PublicKey(daoId))

    const voteTokenId = createMosaicId(masterAccount.address)

    // Index情報
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

    // ガバナンストークンIDの取得
    const mdRes = await getMetadataInfoByQuery(
      `targetAddress=${daoAccount.address.toString()}`,
    )
    const metadatas = mdRes.map(
      (e: MetadataEntry) => {
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
    )!.value.toUpperCase()

    // ガバナンストークンの保有量を取得
    const tokenHolders = await getMosaicHolders(tokenId)

    const data = tokenHolders
      .map((e: any) => {
        const address = decordHexAddress(e.account.address)
        return {
          address,
          amount: Number(
            e.account.mosaics
              .filter((m: any) => m.id === tokenId)
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

    // 投票トークンを作成
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

    // 投票トークンを配布
    const transferDes: descriptors.TransferTransactionV1Descriptor[] = data.map(
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
      ...transferDes.map((tx) => {
        return {
          transaction: tx,
          signer: masterAccount.publicKey,
        }
      }),
    ]

    // アグリゲート
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

    // アナウンス
    const announcedTx = await announceTransaction(masterAccount, tx)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // ダミー
    const dummyDes = createDummy(daoAccount.address.toString())

    const metadataDes = createAccountMetadata(
      daoAccount.address,
      BigInt(100 + mdRes.length - 7), // 100 + metadata length - default metadata
      metadataUpdateValue(
        textEncoder.encode(""),
        textEncoder.encode(announcedTx.hash.toString()),
      ),
    )

    // アグリゲート
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

    // 署名
    const signedBonded = signTransaction(masterAccount, bondedTx)

    // HashLock
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
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await announceBonded(
      announcedHashLockTx.hash.toString(),
      signedBonded.jsonPayload,
    ).catch(() => {
      console.error("hash lock error")
    })

    return c.json({
      message:
        "投票情報の作成を実施しました。他の管理者による承認をお待ちください。",
    })
  } catch (error) {
    console.error("投票情報作成エラー:", error)
    return c.json({ message: "投票情報の作成に失敗しました。" }, 500)
  }
}
