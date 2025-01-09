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
  try {
    const ENV = env<{ PRIVATE_KEY: string }>(c)

    const { daoId, mosaicId, sourceAddresses, amount } = (await c.req.json()) as {
      daoId: string
      mosaicId: string
      sourceAddresses: string[]
      amount: string
    }

    const facade = new SymbolFacade(Config.NETWORK)
    const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
    const daoAccount = facade.createPublicAccount(new PublicKey(daoId))

    // ポイントモザイクの回収
    const revokeDes = revokeMosaic(mosaicId, sourceAddresses, Number(amount))
    const revokeTxs = revokeDes.map((des) =>
      facade.createEmbeddedTransactionFromTypedDescriptor(
        des,
        daoAccount.publicKey,
      ),
    )

    // 手数料代替トランザクションの作成
    const dummyDes = createDummy(daoAccount.address.toString())
    const dummyTx = facade.createEmbeddedTransactionFromTypedDescriptor(
      dummyDes,
      masterAccount.publicKey,
    )

    // アグリゲートトランザクションの作成
    const innerTxs = [...revokeTxs, dummyTx]
    const txHash = SymbolFacade.hashEmbeddedTransactions(innerTxs)
    const aggregateDes = new descriptors.AggregateBondedTransactionV2Descriptor(
      txHash,
      innerTxs,
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
        "ポイントモザイクの回収を実施しました。他の管理者による承認をお待ちください。",
    })
  } catch (error) {
    console.error("ポイントモザイク回収エラー:", error)
    return c.json({ message: "ポイントモザイクの回収に失敗しました。" }, 500)
  }
}
