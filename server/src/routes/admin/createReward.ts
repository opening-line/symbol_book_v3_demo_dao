import type { Context } from "hono"
import { env } from "hono/adapter"
import { PrivateKey, PublicKey } from "symbol-sdk"
import { descriptors, models, SymbolFacade } from "symbol-sdk/symbol"
import { announceBonded } from "../../functions/announceBonded"
import { announceTransaction } from "../../functions/announceTransaction"
import { createHashLock } from "../../functions/createHashLock"
import { createRewardMosaic } from "../../functions/createMosaic"
import { createMosaicId } from "../../functions/createMosaicId"
import { signTransaction } from "../../functions/signTransaction"
import { transferXym } from "../../functions/transfer"
import { Config } from "../../utils/config"

/**
 * 特典モザイクの作成
 */
export const createReward = async (c: Context) => {
  try {
    const ENV = env<{ PRIVATE_KEY: string }>(c)

    const { daoId, mosaicName, amount } = (await c.req.json()) as {
      daoId: string
      mosaicName: string
      amount: number
    }

    const facade = new SymbolFacade(Config.NETWORK)
    const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
    const daoAccount = facade.createPublicAccount(new PublicKey(daoId))
    const mosaicIdInfo = createMosaicId(daoAccount.address)

    // 50XYMをDAOアカウントに入金
    const feeTransferDes = transferXym(daoAccount.address, 50n * 1000000n)
    const feeTx = facade.createEmbeddedTransactionFromTypedDescriptor(
      feeTransferDes,
      masterAccount.publicKey,
    )

    // 特典モザイクの作成
    const rewardMosaicDes = await createRewardMosaic(
      mosaicIdInfo.id,
      mosaicIdInfo.nonce,
      amount,
      false,
      mosaicName,
      daoAccount.address.toString(),
    )
    const txs = [
      {
        transaction: rewardMosaicDes.mosaicDefinitionDescriptor,
        signer: daoAccount.publicKey,
      },
      {
        transaction: rewardMosaicDes.mosaicSupplyChangeDescriptor,
        signer: daoAccount.publicKey,
      },
      {
        transaction: rewardMosaicDes.configureMosaicNameMetadataDescriptor,
        signer: daoAccount.publicKey,
      },
      {
        transaction: rewardMosaicDes.configureMosaicTypeMetadataDescriptor,
        signer: daoAccount.publicKey,
      },
    ]
    const mosaicCreateTxs = txs.map((tx) =>
      facade.createEmbeddedTransactionFromTypedDescriptor(
        tx.transaction,
        tx.signer,
      ),
    )

    // アグリゲートトランザクションの作成
    const innerTxs = [feeTx, ...mosaicCreateTxs]
    const txHash = SymbolFacade.hashEmbeddedTransactions(innerTxs)
    const aggregateDes = new descriptors.AggregateBondedTransactionV3Descriptor(
      txHash,
      innerTxs,
    )
    const mosaicCreateBondedTx =
      models.AggregateBondedTransactionV3.deserialize(
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
    const signedBondedTx = signTransaction(masterAccount, mosaicCreateBondedTx)

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
        "特典モザイクの作成を実施しました。Symbol Walletで署名した後、他の管理者による承認をお待ちください。",
    })
  } catch (error) {
    console.error("特典モザイク作成エラー:", error)
    return c.json({ message: "特典モザイクの作成に失敗しました。" }, 500)
  }
}
