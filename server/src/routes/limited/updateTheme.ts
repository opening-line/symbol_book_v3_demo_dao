import type { Context } from "hono"
import { env } from "hono/adapter"
import { PrivateKey, utils } from "symbol-sdk"
import { descriptors, models, SymbolFacade } from "symbol-sdk/symbol"
import { configureAccountMetadata } from "../../functions/configureMetadata"
import { createDummy } from "../../functions/createDummy"
import { Config } from "../../utils/config"
import { signTransaction } from "../../functions/signTransaction"

export const updateTheme = async (c: Context) => {
  const ENV = env<{ PRIVATE_KEY: string }>(c)

  // テーマ名を取得
  const { address, themeName } = (await c.req.json()) as { address: string; themeName: string }
  const facade = new SymbolFacade(Config.NETWORK)
  const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))

  const accountMetadataDes = await configureAccountMetadata(
    "theme",
    themeName,
    address,
    address,
  )
  console.log("accountMetadataDes", accountMetadataDes)

  const accountMetadataTx = facade.createEmbeddedTransactionFromTypedDescriptor(
    accountMetadataDes,
    masterAccount.publicKey,
  )
  const dummy = createDummy(masterAccount.address.toString())
  const dummyTx = facade.createEmbeddedTransactionFromTypedDescriptor(
    dummy,
    masterAccount.publicKey,
  )
  const innerTxs = [accountMetadataTx, dummyTx]
  const txHash = SymbolFacade.hashEmbeddedTransactions(innerTxs)
  console.log("txHash", txHash)
  const aggregateDes = new descriptors.AggregateCompleteTransactionV2Descriptor(
    txHash,
    innerTxs,
  )
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

  signTransaction(masterAccount, aggregateTx)

  return c.json({ payload: utils.uint8ToHex(aggregateTx.serialize()) })
}
