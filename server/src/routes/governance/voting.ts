import type { Context } from "hono";
import { transferMosaic } from "../../functions/transfer";
import { Address, descriptors, models, SymbolFacade } from "symbol-sdk/symbol";
import { createDummy } from "../../functions/createDummy";
import { PrivateKey, PublicKey, utils } from "symbol-sdk";
import { Config } from "../../utils/config";
import { env } from "hono/adapter";
import { signTransaction } from "../../functions/signTransaction";

export const voting = async (c: Context) => {
  const {
    daoId,
    token,
    publicKey,
    userKey,
    amount,
  } = (await c.req.json()) as {
    daoId: string;
    token: string;
    publicKey: string;
    userKey: string;
    amount: number;
  }

  const ENV = env<{ PRIVATE_KEY: string }>(c)
  const facade = new SymbolFacade(Config.NETWORK)
  const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
  const daoAccount = facade.createPublicAccount(new PublicKey(daoId))
  const userAccount = facade.createPublicAccount(new PublicKey(userKey))

  const voteAccount = facade.createPublicAccount(new PublicKey(publicKey))


  const transferDes = transferMosaic(
    voteAccount.address,
    BigInt(token),
    BigInt(amount),
  )

  const dummyDes = createDummy(daoAccount.address.toString())

  const innerTxs = [
    facade.createEmbeddedTransactionFromTypedDescriptor(
      transferDes,
      userAccount.publicKey
    ),
    facade.createEmbeddedTransactionFromTypedDescriptor(
      dummyDes,
      masterAccount.publicKey
    ) 
  ]
  const txHash = SymbolFacade.hashEmbeddedTransactions(innerTxs)
  const aggregateDes = new descriptors.AggregateCompleteTransactionV2Descriptor(
    txHash,
    innerTxs,
  )
  const tx = models.AggregateCompleteTransactionV2.deserialize(
    facade
      .createTransactionFromTypedDescriptor(
        aggregateDes,
        masterAccount.publicKey,
        Config.FEE_MULTIPLIER,
        Config.DEADLINE_SECONDS,
      )
      .serialize(),
  )

  signTransaction(masterAccount, tx)

  return c.json({
    payload: utils.uint8ToHex(tx.serialize()),
    daoId: daoAccount.publicKey.toString(),
  })
}