import type { Context } from "hono"
import { generateAccount } from "../../transactions/generateAccount"
import { env } from "hono/adapter"
import { PrivateKey, PublicKey, utils } from "symbol-sdk"
import {
  descriptors,
  metadataUpdateValue,
  SymbolFacade,
} from "symbol-sdk/symbol"
import { Config } from "../../utils/config"
import { transferXym } from "../../transactions/transfer"
import { createMosaic } from "../../transactions/createMosaic"
import { createMultisig } from "../../transactions/createMultisig"
import { METADATA_KEYS } from "../../utils/metadataKeys"
import { createMosaicId } from "../../transactions/createMosaicId"
import { createMetadata } from "../../transactions/createMetadata"
import { models } from "symbol-sdk/symbol"

export const createAdmin = async (c: Context) => {
  // TODO: 準備
  const ENV = env<{ PRIVATE_KEY: string }>(c)
  const facade = new SymbolFacade(Config.NETWORK)
  const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))

  const { daoName, ownerPublicKey } = await c.req.json() as { daoName: string, ownerPublicKey: string }

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

  // TODO: DAO アカウントの生成
  const daoAccount = generateAccount()

  // TODO: 100XYMをDAOアカウントに入金
  const transferDes = transferXym(daoAccount.address, 100n * 1000000n)

  // TODO: ガバナンストークンの生成
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
    100,
    flags,
  )

  // TODO: 会員証NFTの生成
  const nftIdInfo = createMosaicId(daoAccount.address)
  const memberNftDes = createMosaic(nftIdInfo.id, nftIdInfo.nonce, 100, flags)

  // TODO: DAOアカウントをマルチシグに変換
  const daoAccountMultisig = createMultisig([ownerAccount.address])

  // TODO: Vote先アカウントの生成
  const voteAccounts = [
    generateAccount(),
    generateAccount(),
    generateAccount(),
    generateAccount(),
  ]

  // TODO: メタデータの登録
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
      key: METADATA_KEYS.MEMBER_NFT_ID,
      value: `0${nftIdInfo.id.toString(16)}`.slice(-16),
    },
    {
      key: METADATA_KEYS.DAO_NAME,
      value: daoName,
    },
  ]

  const textEncoder = new TextEncoder()

  const metadataTxs = metadatas.map((m) =>
    createMetadata(
      daoAccount.address,
      m.key,
      metadataUpdateValue(textEncoder.encode(""), textEncoder.encode(m.value)),
    ),
  )

  // TODO: アグリゲート
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
      transaction: memberNftDes.mosaicDefinitionDescriptor,
      signer: daoAccount.publicKey,
    },
    {
      transaction: memberNftDes.mosaicSupplyChangeDescriptor,
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

  // TODO: 署名
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

  const signatureMaster = masterAccount.signTransaction(tx)

  facade.transactionFactory.static.attachSignature(tx, signatureMaster)

  const cosign = facade.cosignTransaction(daoAccount.keyPair, tx)

  tx.cosignatures.push(cosign)

  // const jsonPayload2 = `{"payload":"${utils.uint8ToHex(tx.serialize())}"}`

  // const hash = facade.hashTransaction(tx)

  // const sendRes = await fetch(new URL("/transactions", Config.NODE_URL), {
  //   method: "PUT",
  //   headers: { "Content-Type": "application/json" },
  //   body: jsonPayload2,
  // }).then((res) => res.json())
  // console.log(sendRes)

  // await new Promise((resolve) => setTimeout(resolve, 1000))

  // const statusRes = await fetch(
  //   new URL("/transactionStatus/" + hash, Config.NODE_URL),
  // ).then((res) => res.json())
  // console.log(statusRes)

  return c.json({
    payload: utils.uint8ToHex(tx.serialize())
  })
}
