import type { Context } from "hono"
import { env } from "hono/adapter"
import { PrivateKey, PublicKey } from "symbol-sdk"
import { Address, descriptors, models, SymbolFacade } from "symbol-sdk/symbol"
import { announceBonded } from "../../functions/announceBonded"
import { announceTransaction } from "../../functions/announceTransaction"
import { createDummy } from "../../functions/createDummy"
import { createHashLock } from "../../functions/createHashLock"
import { revokeMosaic } from "../../functions/revokeMosaic"
import { signTransaction } from "../../functions/signTransaction"
import { transfer } from "../../functions/transfer"
import { Config } from "../../utils/config"

/**
 * ポイントモザイクと特典モザイクの交換
 */
export const exchangeItem = async (c: Context) => {
  try {
    const ENV = env<{ PRIVATE_KEY: string }>(c)

    const {
      daoId,
      toAddress,
      rewardMosaicId,
      rewardMosaicAmount,
      pointMosaicId,
      pointMosaicAmount,
    } = (await c.req.json()) as {
      daoId: string
      toAddress: string
      rewardMosaicId: string
      rewardMosaicAmount: number
      pointMosaicId: string
      pointMosaicAmount: number
    }

    const facade = new SymbolFacade(Config.NETWORK)
    const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
    const daoAccount = facade.createPublicAccount(new PublicKey(daoId))

    // ポイントモザイクの回収
    const revokeDes = revokeMosaic(
      pointMosaicId,
      [toAddress],
      pointMosaicAmount,
    )
    const revokeTxs = revokeDes.map((des) =>
      facade.createEmbeddedTransactionFromTypedDescriptor(
        des,
        daoAccount.publicKey,
      ),
    )

    // 交換アイテムの配布
    const recipientAddress = new Address(toAddress)
    const transferDes = transfer(
      recipientAddress,
      BigInt(`0x${rewardMosaicId}`),
      BigInt(rewardMosaicAmount),
    )
    const transferTx = facade.createEmbeddedTransactionFromTypedDescriptor(
      transferDes,
      daoAccount.publicKey,
    )

    // 手数料代替トランザクションの作成
    const dummyDes = createDummy(daoAccount.address.toString())
    const dummyTx = facade.createEmbeddedTransactionFromTypedDescriptor(
      dummyDes,
      masterAccount.publicKey,
    )

    // アグリゲートトランザクションの作成
    const innerTxs = [...revokeTxs, transferTx, dummyTx]
    const txHash = SymbolFacade.hashEmbeddedTransactions(innerTxs)
    const aggregateDes = new descriptors.AggregateBondedTransactionV2Descriptor(
      txHash,
      innerTxs,
    )
    const mosaicRevokeBondedTx =
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
    const signedBondedTx = signTransaction(masterAccount, mosaicRevokeBondedTx)

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
        "アイテム交換申請を実施しました。管理者による承認をお待ちください。",
    })
  } catch (error) {
    console.error("アイテム交換申請エラー:", error)
    return c.json({ message: "アイテム交換申請に失敗しました。" }, 500)
  }
}
