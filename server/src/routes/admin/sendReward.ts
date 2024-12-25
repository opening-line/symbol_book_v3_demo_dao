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
 * 特典モザイクを配布する
 */
export const sendReward = async (c: Context) => {
  try {
    const ENV = env<{ PRIVATE_KEY: string }>(c)

    const { daoId, mosaicId, recipientsAddresses, amount, message } =
      (await c.req.json()) as {
        daoId: string
        mosaicId: string
        recipientsAddresses: string[]
        amount: string
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
    const dummy = createDummy(daoAccount.address.toString())
    const dummyTransaction = facade.createEmbeddedTransactionFromTypedDescriptor(
      dummy,
      masterAccount.publicKey,
    )
    const innerTx = [...transferTxs, dummyTransaction]
    const txHash = SymbolFacade.hashEmbeddedTransactions(innerTx)
    const aggregateDes = new descriptors.AggregateBondedTransactionV2Descriptor(
      txHash,
      innerTx,
    )
    const mosaicSendBondedTx = models.AggregateBondedTransactionV2.deserialize(
      facade
        .createTransactionFromTypedDescriptor(
          aggregateDes,
          masterAccount.publicKey,
          Config.FEE_MULTIPLIER,
          Config.DEADLINE_SECONDS,
        )
        .serialize(),
    )

    const signedBonded = signTransaction(masterAccount, mosaicSendBondedTx)

    const hashLock = createHashLock(signedBonded.hash)
    const hashLockTx = facade.createTransactionFromTypedDescriptor(
      hashLock,
      masterAccount.publicKey,
      Config.FEE_MULTIPLIER,
      Config.DEADLINE_SECONDS,
    )

    const announcedHashLock = await announceTransaction(masterAccount, hashLockTx)
    await announceBonded(
      announcedHashLock.hash.toString(),
      signedBonded.jsonPayload,
    ).catch(() => {
      console.error("hash lock error")
    })

    return c.json({
      message:
        "特典モザイクの配布を実施しました。他の管理者による承認をお待ちください。",
    })
  } catch (error) {
    console.error("特典モザイク配布エラー:", error)
    return c.json({ message: "特典モザイクの配布に失敗しました。" }, 500)
  }
}
