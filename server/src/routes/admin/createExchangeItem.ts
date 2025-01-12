import type { Context } from "hono"
import { env } from "hono/adapter"
import { PrivateKey, PublicKey } from "symbol-sdk"
import { descriptors, models, SymbolFacade } from "symbol-sdk/symbol"
import { announceBonded } from "../../functions/announceBonded"
import { announceTransaction } from "../../functions/announceTransaction"
import { configureMosaicMetadata } from "../../functions/configureMetadata"
import { createDummy } from "../../functions/createDummy"
import { createHashLock } from "../../functions/createHashLock"
import { signTransaction } from "../../functions/signTransaction"
import { Config } from "../../utils/config"

/**
 * 交換アイテムの設定
 */
export const createExchangeItem = async (c: Context) => {
  try {
    const ENV = env<{ PRIVATE_KEY: string }>(c)

    const {
      daoId,
      description,
      rewardMosaicId,
      pointMosaicId,
      pointMosaicName,
      exchangeCost,
    } = (await c.req.json()) as {
      daoId: string
      description: string
      rewardMosaicId: string
      pointMosaicId: string
      pointMosaicName: string
      exchangeCost: string
    }

    const facade = new SymbolFacade(Config.NETWORK)
    const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
    const daoAccount = facade.createPublicAccount(new PublicKey(daoId))

    // モザイクメタデータの追加
    // 交換アイテム用フラグを定義
    const exchangeableMetadataDes = await configureMosaicMetadata(
      "exchangeable",
      "true",
      rewardMosaicId,
      false,
      daoAccount.address.toString(),
    )

    // 交換アイテムの詳細を定義
    const descriptionMetadataDes = await configureMosaicMetadata(
      "description",
      description,
      rewardMosaicId,
      false,
      daoAccount.address.toString(),
    )

    // 交換に使用するポイントモザイクIDを定義
    const exchangePointMosaicIdMetadataDes = await configureMosaicMetadata(
      "pointMosaicId",
      pointMosaicId,
      rewardMosaicId,
      false,
      daoAccount.address.toString(),
    )

    // 交換に使用するポイントモザイク名を定義
    const exchangePointMosaicNameMetadataDes = await configureMosaicMetadata(
      "pointMosaicName",
      pointMosaicName,
      rewardMosaicId,
      false,
      daoAccount.address.toString(),
    )

    // 交換アイテムのコストを定義
    const exchangeCostMetadataDes = await configureMosaicMetadata(
      "exchangeCost",
      exchangeCost,
      rewardMosaicId,
      false,
      daoAccount.address.toString(),
    )

    const txs = [
      {
        transaction: exchangeableMetadataDes,
        signer: daoAccount.publicKey,
      },
      {
        transaction: descriptionMetadataDes,
        signer: daoAccount.publicKey,
      },
      {
        transaction: exchangePointMosaicIdMetadataDes,
        signer: daoAccount.publicKey,
      },
      {
        transaction: exchangePointMosaicNameMetadataDes,
        signer: daoAccount.publicKey,
      },
      {
        transaction: exchangeCostMetadataDes,
        signer: daoAccount.publicKey,
      },
    ]
    const metadataTxs = txs.map((tx) =>
      facade.createEmbeddedTransactionFromTypedDescriptor(
        tx.transaction,
        tx.signer,
      ),
    )

    // 手数料代替トランザクションの作成
    const dummyDes = createDummy(daoAccount.address.toString())
    const dummyTx = facade.createEmbeddedTransactionFromTypedDescriptor(
      dummyDes,
      masterAccount.publicKey,
    )

    // アグリゲートトランザクションの作成
    const innerTxs = [...metadataTxs, dummyTx]
    const txHash = SymbolFacade.hashEmbeddedTransactions(innerTxs)
    const aggregateDes = new descriptors.AggregateBondedTransactionV2Descriptor(
      txHash,
      innerTxs,
    )
    const mosaicUpdateBondedTx =
      models.AggregateBondedTransactionV2.deserialize(
        facade
          .createTransactionFromTypedDescriptor(
            aggregateDes,
            masterAccount.publicKey,
            Config.FEE_MULTIPLIER,
            Config.DEADLINE_SECONDS,
          )
          .serialize(),
      )

    // 署名
    const signedBondedTx = signTransaction(masterAccount, mosaicUpdateBondedTx)

    // ハッシュロックトランザクションの作成
    const hashLockDes = createHashLock(signedBondedTx.hash)
    const hashLockTx = facade.createTransactionFromTypedDescriptor(
      hashLockDes,
      masterAccount.publicKey,
      Config.FEE_MULTIPLIER,
      Config.DEADLINE_SECONDS,
    )

    const announcedHashLockTx = await announceTransaction(
      masterAccount,
      hashLockTx,
    )

    await announceBonded(
      announcedHashLockTx.hash.toString(),
      signedBondedTx.jsonPayload,
    ).catch(() => {
      console.error("hash lock error")
    })

    return c.json({
      message:
        "交換アイテムの作成を実施しました。他の管理者による承認をお待ちください。",
    })
  } catch (error) {
    console.error("交換アイテム作成エラー:", error)
    return c.json({ message: "交換アイテムの作成に失敗しました。" }, 500)
  }
}
