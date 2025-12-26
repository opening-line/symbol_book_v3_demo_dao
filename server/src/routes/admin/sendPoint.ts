import type { Context } from "hono"
import { env } from "hono/adapter"
import { PrivateKey, PublicKey } from "symbol-sdk"
import { Address, descriptors, models, SymbolFacade } from "symbol-sdk/symbol"
import { announceBonded } from "../../functions/announceBonded"
import { announceTransaction } from "../../functions/announceTransaction"
import { createDummy } from "../../functions/createDummy"
import { createHashLock } from "../../functions/createHashLock"
import { signTransaction } from "../../functions/signTransaction"
import { transfer } from "../../functions/transfer"
import { Config } from "../../utils/config"

/**
 * ポイントモザイクを配布する
 */
export const sendPoint = async (c: Context) => {
  try {
    const ENV = env<{ PRIVATE_KEY: string }>(c)

    const { daoId, mosaicId, recipientsAddresses, amount, message } =
      (await c.req.json()) as {
        daoId: string
        mosaicId: string
        recipientsAddresses: string[]
        amount: number
        message: string
      }

    const facade = new SymbolFacade(Config.NETWORK)
    const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
    const daoAccount = facade.createPublicAccount(new PublicKey(daoId))

    // 複数のtransferTransactionを生成
    const transferTxs = recipientsAddresses.map((address) => {
      const recipientAddress = new Address(address)
      const transferDes = transfer(
        recipientAddress,
        BigInt(`0x${mosaicId}`),
        BigInt(amount),
        message,
      )
      return facade.createEmbeddedTransactionFromTypedDescriptor(
        transferDes,
        daoAccount.publicKey,
      )
    })

    // 手数料代替トランザクションの作成
    const dummyDes = createDummy(daoAccount.address.toString())
    const dummyTx = facade.createEmbeddedTransactionFromTypedDescriptor(
      dummyDes,
      masterAccount.publicKey,
    )

    // アグリゲートトランザクションの作成
    const innerTxs = [...transferTxs, dummyTx]
    const txHash = SymbolFacade.hashEmbeddedTransactions(innerTxs)
    const aggregateDes = new descriptors.AggregateBondedTransactionV3Descriptor(
      txHash,
      innerTxs,
    )
    const mosaicSendBondedTx = models.AggregateBondedTransactionV3.deserialize(
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
    const signedBondedTx = signTransaction(masterAccount, mosaicSendBondedTx)

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
        "ポイントモザイクの配布を実施しました。Symbol Walletで署名した後、他の管理者による承認をお待ちください。",
    })
  } catch (error) {
    console.error("ポイントモザイク配布エラー:", error)
    return c.json({ message: "ポイントモザイクの配布に失敗しました。" }, 500)
  }
}
