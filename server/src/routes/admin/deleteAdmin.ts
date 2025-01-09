import type { Context } from "hono"
import { env } from "hono/adapter"
import { PrivateKey, PublicKey } from "symbol-sdk"
import { Address, descriptors, models, SymbolFacade } from "symbol-sdk/symbol"
import { announceBonded } from "../../functions/announceBonded"
import { announceTransaction } from "../../functions/announceTransaction"
import { createDummy } from "../../functions/createDummy"
import { createHashLock } from "../../functions/createHashLock"
import { deleteMultisig } from "../../functions/deleteMultisig"
import { signTransaction } from "../../functions/signTransaction"
import { Config } from "../../utils/config"

/**
 * DAO管理者アカウントの削除
 */
export const deleteAdmin = async (c: Context) => {
  try {
    const ENV = env<{ PRIVATE_KEY: string }>(c)

    const { daoId, addresses } = (await c.req.json()) as {
      daoId: string
      addresses: string[]
    }

    const facade = new SymbolFacade(Config.NETWORK)
    const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
    const daoAccount = facade.createPublicAccount(new PublicKey(daoId))

    // DAO管理者アカウントの削除
    const deleteAdmins = addresses.map((address) => new Address(address))
    const daoAccountMultisigDes = deleteMultisig(deleteAdmins)
    const multisigTx =
      facade.createEmbeddedTransactionFromTypedDescriptor(
        daoAccountMultisigDes,
        daoAccount.publicKey,
      )

    // 手数料代替トランザクションの作成
    const dummyDes = createDummy(daoAccount.address.toString())
    const dummyTx = facade.createEmbeddedTransactionFromTypedDescriptor(
      dummyDes,
      masterAccount.publicKey,
    )
    
    // アグリゲートトランザクションの作成
    const innerTxs = [multisigTx, dummyTx]
    const txHash = SymbolFacade.hashEmbeddedTransactions(innerTxs)
    const aggregateDes = new descriptors.AggregateBondedTransactionV2Descriptor(
      txHash,
      innerTxs,
    )
    const adminDeleteBondedTx = models.AggregateBondedTransactionV2.deserialize(
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
    const signedBondedTx = signTransaction(masterAccount, adminDeleteBondedTx)

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
        "DAO管理者アカウントの削除を実施しました。他の管理者による承認をお待ちください。",
    })
  } catch (error) {
    console.error("DAO管理者アカウント削除エラー:", error)
    return c.json({ message: "DAO管理者アカウントの削除に失敗しました。" }, 500)
  }
}
