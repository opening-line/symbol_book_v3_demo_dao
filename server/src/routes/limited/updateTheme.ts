import type { Context } from "hono"
import { env } from "hono/adapter"
import { PrivateKey, PublicKey, utils } from "symbol-sdk"
import {
  descriptors,
  models,
  SymbolFacade,
  SymbolPublicAccount,
} from "symbol-sdk/symbol"
import { configureAccountMetadata } from "../../functions/configureMetadata"
import { createDummy } from "../../functions/createDummy"
import { Config } from "../../utils/config"
import { signTransaction } from "../../functions/signTransaction"

/**
 * テーマの更新
 */
export const updateTheme = async (c: Context) => {
  try {
    const ENV = env<{ PRIVATE_KEY: string }>(c)

    // テーマ名を取得
    const { publicKey, themeName } = (await c.req.json()) as {
      publicKey: string
      themeName: string
    }

    const facade = new SymbolFacade(Config.NETWORK)
    const userAccount = new SymbolPublicAccount(
      facade,
      new PublicKey(publicKey),
    )
    const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))

    // メタデータの更新
    const accountMetadataDes = await configureAccountMetadata(
      "theme",
      themeName,
      userAccount.address.toString(),
      userAccount.address.toString(),
    )

    const accountMetadataTx =
      facade.createEmbeddedTransactionFromTypedDescriptor(
        accountMetadataDes,
        userAccount.publicKey,
      )

    // 手数料代替トランザクションの作成
    const dummyDes = createDummy(masterAccount.address.toString())
    const dummyTx = facade.createEmbeddedTransactionFromTypedDescriptor(
      dummyDes,
      masterAccount.publicKey,
    )

    // アグリゲートトランザクションの作成
    const innerTxs = [accountMetadataTx, dummyTx]
    const txHash = SymbolFacade.hashEmbeddedTransactions(innerTxs)
    const aggregateDes =
      new descriptors.AggregateCompleteTransactionV2Descriptor(txHash, innerTxs)
    const aggregateTx = models.AggregateCompleteTransactionV2.deserialize(
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
    signTransaction(masterAccount, aggregateTx)

    return c.json({ payload: utils.uint8ToHex(aggregateTx.serialize()) })
  } catch (error) {
    console.error("テーマ更新エラー:", error)
    return c.json({ message: "テーマの更新に失敗しました" }, 500)
  }
}
