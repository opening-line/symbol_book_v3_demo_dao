import type { Context } from "hono"
import { env } from "hono/adapter"
import { PrivateKey, PublicKey, utils } from "symbol-sdk"
import { descriptors, models, SymbolFacade } from "symbol-sdk/symbol"
import { createDummy } from "../../functions/createDummy"
import { signTransaction } from "../../functions/signTransaction"
import { transferMosaic } from "../../functions/transfer"
import { Config } from "../../utils/config"

/**
 * 投票実施
 */
export const voting = async (c: Context) => {
  try {
    const ENV = env<{ PRIVATE_KEY: string }>(c)

    const { daoId, token, publicKey, userKey, amount } =
      (await c.req.json()) as {
        daoId: string
        token: string
        publicKey: string
        userKey: string
        amount: number
      }

    const facade = new SymbolFacade(Config.NETWORK)
    const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
    const daoAccount = facade.createPublicAccount(new PublicKey(daoId))
    const userAccount = facade.createPublicAccount(new PublicKey(userKey))
    const voteAccount = facade.createPublicAccount(new PublicKey(publicKey))

    // 投票
    const voteDes = transferMosaic(
      voteAccount.address,
      BigInt(token),
      BigInt(amount),
    )
    const voteTx = facade.createEmbeddedTransactionFromTypedDescriptor(
      voteDes,
      userAccount.publicKey,
    )

    // 手数料代替トランザクションの作成
    const dummyDes = createDummy(daoAccount.address.toString())
    const dummyTx = facade.createEmbeddedTransactionFromTypedDescriptor(
      dummyDes,
      masterAccount.publicKey,
    )

    // アグリゲートトランザクションの作成
    const innerTxs = [voteTx, dummyTx]
    const txHash = SymbolFacade.hashEmbeddedTransactions(innerTxs)
    const aggregateDes =
      new descriptors.AggregateCompleteTransactionV3Descriptor(txHash, innerTxs)
    const votingTx = models.AggregateCompleteTransactionV3.deserialize(
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
    signTransaction(masterAccount, votingTx)

    return c.json({
      payload: utils.uint8ToHex(votingTx.serialize()),
      daoId: daoAccount.publicKey.toString(),
    })
  } catch (error) {
    console.error("投票エラー:", error)
    return c.json({ message: "投票データの作成に失敗しました。" }, 500)
  }
}
