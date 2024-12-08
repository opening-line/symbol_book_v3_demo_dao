import type { Context } from "hono"
import { getMosaicHolders } from "../../info/getAccountInfo"
import { Address, models, SymbolFacade } from "symbol-sdk/symbol"
import { PublicKey, utils } from "symbol-sdk"
import { pickMetadata } from "../../functions/pickMetadata"
import { getMetadataInfoByQuery } from "../../info/getMetadataInfoByQuery"
import { Config } from "../../utils/config"
import { METADATA_KEYS } from "../../utils/metadataKeys"

interface MetadataEntry {
  metadataEntry: {
    scopedMetadataKey: string
    value: string
  }
}

const decodeMetadataValue = (value: string) =>
  new TextDecoder().decode(Buffer.from(value, "hex"))

/**
 * 対象モザイクを保有しているDAOメンバーの一覧を取得
 */
export const getHolders = async (c: Context) => {
  const mosaicId = c.req.param("mosaicId")
  const id = c.req.param("id")
  const facade = new SymbolFacade(Config.NETWORK)
  const daoAccount = facade.createPublicAccount(new PublicKey(id))
  const address = daoAccount.address.toString()
  const accountMetadata = await getMetadataInfoByQuery(
    `targetAddress=${address}`,
  )

  // ガバナンストークンIDの取得
  const governanceMosaicId = pickMetadata(
    accountMetadata.map((e: MetadataEntry) => ({
      key: e.metadataEntry.scopedMetadataKey,
      value: decodeMetadataValue(e.metadataEntry.value),
    })),
    METADATA_KEYS.GOVERNANCE_TOKEN_ID,
  ).value.toUpperCase()
  const allDaoMembers = await getMosaicHolders(governanceMosaicId)

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
      const amount = holder.account.mosaics.find(
        (mosaic: { id: string; amount: string }) => mosaic.id === mosaicId,
      )?.amount
      const address = new Address(
        new models.UnresolvedAddress(utils.hexToUint8(holder.account.address))
          .bytes,
      ).toString()
      return {
        address,
        amount: amount || "0",
      }
    },
  )

  return c.json(res)
}
