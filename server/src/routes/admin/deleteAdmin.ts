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
    const daoAccountMultisig = deleteMultisig(deleteAdmins)
    const multisigTransaction =
      facade.createEmbeddedTransactionFromTypedDescriptor(
        daoAccountMultisig,
        daoAccount.publicKey,
      )

    // 手数料代替トランザクションの作成
    const dummy = createDummy(daoAccount.address.toString())
    const dummyTransaction = facade.createEmbeddedTransactionFromTypedDescriptor(
      dummy,
      masterAccount.publicKey,
    )
    
    // アグリゲート
    const innerTransactions = [multisigTransaction, dummyTransaction]
    const txHash = SymbolFacade.hashEmbeddedTransactions(innerTransactions)
    const aggregateDes = new descriptors.AggregateBondedTransactionV2Descriptor(
      txHash,
      innerTransactions,
    )
    const tx = models.AggregateBondedTransactionV2.deserialize(
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
    const signedBonded = signTransaction(masterAccount, tx)

    // HashLock
    const hashLock = createHashLock(signedBonded.hash)
    const hashLockTransaction = facade.createTransactionFromTypedDescriptor(
      hashLock,
      masterAccount.publicKey,
      Config.FEE_MULTIPLIER,
      Config.DEADLINE_SECONDS,
    )

    const announcedHashLockTx = await announceTransaction(
      masterAccount,
      hashLockTransaction,
    )

    await announceBonded(
      announcedHashLockTx.hash.toString(),
      signedBonded.jsonPayload,
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
