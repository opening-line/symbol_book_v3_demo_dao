import type { Context } from "hono"
import { env } from "hono/adapter"
import { PrivateKey, PublicKey, utils } from "symbol-sdk"
import {
  descriptors,
  metadataUpdateValue,
  models,
  SymbolFacade,
} from "symbol-sdk/symbol"
import { addMultisig } from "../../functions/addMultisig"
import { createAccountMetadata } from "../../functions/createAccountMetadata"
import { createMosaic } from "../../functions/createMosaic"
import { createMosaicId } from "../../functions/createMosaicId"
import { generateAccount } from "../../functions/generateAccount"
import { METADATA_KEYS } from "../../utils/metadataKeys"
import { signTransaction } from "../../functions/signTransaction"
import { transferXym } from "../../functions/transfer"
import { Config } from "../../utils/config"

/**
 * DAOの作成
 */
export const createDao = async (c: Context) => {
  try {
    const ENV = env<{ PRIVATE_KEY: string }>(c)

    const { daoName, ownerPublicKey } = (await c.req.json()) as {
      daoName: string
      ownerPublicKey: string
    }

    const textEncoder = new TextEncoder()
    const facade = new SymbolFacade(Config.NETWORK)
    const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
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

    // 投票箱アカウントの生成
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

    const metadataTxs = metadatas.map((m) =>
      createAccountMetadata(
        daoAccount.address,
        m.key,
        metadataUpdateValue(textEncoder.encode(""), textEncoder.encode(m.value)),
      ),
    )
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
    
    // アグリゲート
    const innerTransactions = txs.map((tx) =>
      facade.createEmbeddedTransactionFromTypedDescriptor(
        tx.transaction,
        tx.signer,
      ),
    )
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

    // 署名
    signTransaction(masterAccount, tx)

    // DAOアカウントで連署名
    const cosign = facade.cosignTransaction(daoAccount.keyPair, tx)

    tx.cosignatures.push(cosign)

    return c.json({
      payload: utils.uint8ToHex(tx.serialize()),
      daoId: daoAccount.publicKey.toString(),
    })
  } catch (error) {
    console.error("DAO作成エラー:", error)
    return c.json({ message: "DAOの作成に失敗しました。再度実行してください。" }, 500)
  }
}
