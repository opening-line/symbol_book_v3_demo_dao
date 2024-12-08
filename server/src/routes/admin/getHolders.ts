import type { Context } from "hono"
import { PublicKey, utils } from "symbol-sdk"
import { Address, models, SymbolFacade } from "symbol-sdk/symbol"
import { pickMetadata } from "../../functions/pickMetadata"
import { getMosaicHolders } from "../../info/getAccountInfo"
import { getMetadataInfoByQuery } from "../../info/getMetadataInfoByQuery"
import { Config } from "../../utils/config"
import { METADATA_KEYS } from "../../utils/metadataKeys"

interface MetadataEntry {
  metadataEntry: {
    scopedMetadataKey: string
    value: string
  }
}

/**
 * 対象モザイクを保有しているDAOメンバーの一覧を取得
 */
export const getHolders = async (c: Context) => {
  try {
    const id = c.req.param("id")
    const mosaicId = c.req.param("mosaicId")

    const textDecoder = new TextDecoder()
    const facade = new SymbolFacade(Config.NETWORK)
    const daoAccount = facade.createPublicAccount(new PublicKey(id))
    const address = daoAccount.address.toString()

    // アカウントメタデータの取得
    const accountMdRes = await getMetadataInfoByQuery(
      `targetAddress=${address}`,
    )
    const accountMetadatas = accountMdRes.map((e: MetadataEntry) => {
      return {
        key: e.metadataEntry.scopedMetadataKey,
        value: textDecoder.decode(
          Uint8Array.from(Buffer.from(e.metadataEntry.value, "hex")),
        ),
      }
    })

    // ガバナンストークンIDの取得
    const govTokenId = pickMetadata(
      accountMetadatas,
      METADATA_KEYS.GOVERNANCE_TOKEN_ID,
    )!.value.toUpperCase()

    // 対象モザイクを保有しているDAOメンバーの一覧を取得
    const allDaoMembers = await getMosaicHolders(govTokenId)

    // DAOアカウントを除外
    const daoMembers = allDaoMembers.filter(
      (holder: {
        account: {
          address: string
        }
      }) => {
        const holderAddress = new Address(
          new models.UnresolvedAddress(utils.hexToUint8(holder.account.address))
            .bytes,
        ).toString()
        return holderAddress !== address
      },
    )

    const res = daoMembers.map(
      (holder: {
        account: {
          address: string
          mosaics: { id: string; amount: string }[]
        }
      }) => {
        const address = new Address(
          new models.UnresolvedAddress(utils.hexToUint8(holder.account.address))
            .bytes,
        ).toString()
        const amount = holder.account.mosaics.find(
          (mosaic: { id: string; amount: string }) => mosaic.id === mosaicId,
        )?.amount

        return {
          address,
          amount: amount || "0",
        }
      },
    )

    return c.json(res)
  } catch (error) {
    console.error("DAOメンバー取得エラー:", error)
    return c.json({ message: "DAOメンバーの取得に失敗しました。" }, 500)
  }
}
