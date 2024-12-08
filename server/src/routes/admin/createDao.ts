import type { Context } from "hono"
import { generateAccount } from "../../functions/generateAccount"
import { env } from "hono/adapter"
import { PrivateKey, PublicKey, utils } from "symbol-sdk"
import {
  descriptors,
  metadataUpdateValue,
  SymbolFacade,
} from "symbol-sdk/symbol"
import { Config } from "../../utils/config"
import { transferXym } from "../../functions/transfer"
import { createMosaic } from "../../functions/createMosaic"
import { addMultisig } from "../../functions/addMultisig"
import { METADATA_KEYS } from "../../utils/metadataKeys"
import { createMosaicId } from "../../functions/createMosaicId"
import { createAccountMetadata } from "../../functions/createAccountMetadata"
import { models } from "symbol-sdk/symbol"
import { signTransaction } from "../../functions/signTransaction"

export const createDao = async (c: Context) => {
  // 準備
  const ENV = env<{ PRIVATE_KEY: string }>(c)
  const facade = new SymbolFacade(Config.NETWORK)
  const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))

  const { daoName, ownerPublicKey } = (await c.req.json()) as {
    daoName: string
    ownerPublicKey: string
  }

  if (daoName === undefined || daoName === "") {
    return c.json({ message: "daoName is required" }, 400)
  }
  if (ownerPublicKey === undefined || ownerPublicKey === "") {
    return c.json({ message: "ownerPublicKey is required" }, 400)
  }
  if (ownerPublicKey.length !== 64) {
    return c.json({ message: "ownerPublicKey is invalid" }, 400)
  }

  const ownerAccount = facade.createPublicAccount(new PublicKey(ownerPublicKey))

  // DAO アカウントの生成
  const daoAccount = generateAccount()

  // 50XYMをDAOアカウントに入金
  const transferDes = transferXym(daoAccount.address, 50n * 1000000n)

  // ガバナンストークンの生成
  const flags = {
    supplyMutable: false,
    transferable: false,
    restrictable: false,
    revokable: true,
  }

  const mosaicIdInfo = createMosaicId(daoAccount.address)
  const createGovTokenDes = createMosaic(
    mosaicIdInfo.id,
    mosaicIdInfo.nonce,
    Config.TOKEN_AMOUNT,
    flags,
  )

  // DAOアカウントをマルチシグに変換
  const daoAccountMultisig = addMultisig([ownerAccount.address])

  // Vote先アカウントの生成
  const voteAccounts = [
    generateAccount(),
    generateAccount(),
    generateAccount(),
    generateAccount(),
  ]

  // メタデータの登録
  const metadatas = [
    {
      key: METADATA_KEYS.GOVERNANCE_TOKEN_ID,
      value: `0${mosaicIdInfo.id.toString(16)}`.slice(-16),
    },
    {
      key: METADATA_KEYS.VOTE_A,
      value: voteAccounts[0].publicKey.toString(),
    },
    {
      key: METADATA_KEYS.VOTE_B,
      value: voteAccounts[1].publicKey.toString(),
    },
    {
      key: METADATA_KEYS.VOTE_C,
      value: voteAccounts[2].publicKey.toString(),
    },
    {
      key: METADATA_KEYS.VOTE_D,
      value: voteAccounts[3].publicKey.toString(),
    },
    {
      key: METADATA_KEYS.DAO_NAME,
      value: daoName,
    },
  ]

  const textEncoder = new TextEncoder()

  const metadataTxs = metadatas.map((m) =>
    createAccountMetadata(
      daoAccount.address,
      m.key,
      metadataUpdateValue(textEncoder.encode(""), textEncoder.encode(m.value)),
    ),
  )

  // アグリゲート
  const txs = [
    {
      transaction: transferDes,
      signer: masterAccount.publicKey,
    },
    {
      transaction: createGovTokenDes.mosaicDefinitionDescriptor,
      signer: daoAccount.publicKey,
    },
    {
      transaction: createGovTokenDes.mosaicSupplyChangeDescriptor,
      signer: daoAccount.publicKey,
    },
    {
      transaction: daoAccountMultisig,
      signer: daoAccount.publicKey,
    },
    ...metadataTxs.map((tx) => ({
      transaction: tx,
      signer: masterAccount.publicKey,
    })),
  ]

  const innerTransactions = txs.map((tx) =>
    facade.createEmbeddedTransactionFromTypedDescriptor(
      tx.transaction,
      tx.signer,
    ),
  )

  // 署名
  const txHash = SymbolFacade.hashEmbeddedTransactions(innerTransactions)
  const aggregateDes = new descriptors.AggregateCompleteTransactionV2Descriptor(
    txHash,
    innerTransactions,
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

  const cosign = facade.cosignTransaction(daoAccount.keyPair, tx)

  tx.cosignatures.push(cosign)

  return c.json({
    payload: utils.uint8ToHex(tx.serialize()),
    daoId: daoAccount.publicKey.toString(),
  })
}
