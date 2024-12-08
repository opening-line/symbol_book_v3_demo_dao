import type { Context } from "hono"
import { PublicKey } from "symbol-sdk"
import { SymbolFacade } from "symbol-sdk/symbol"
import { getMetadataInfoByQuery } from "../../info/getMetadataInfoByQuery"
import { getMultisigInfo } from "../../info/getMultisigInfo"
import { Config } from "../../utils/config"
import { decordHexAddress } from "../../utils/decordHexAddress"

export const getDao = async (c: Context) => {
  try {
    const id = c.req.param("id")

    const textDecoder = new TextDecoder()
    const facade = new SymbolFacade(Config.NETWORK)
    const daoAccount = facade.createPublicAccount(new PublicKey(id))
    const address = daoAccount.address

    // メタデータ情報の取得
    const mdRes = await getMetadataInfoByQuery(
      `targetAddress=${address.toString()}`,
    )
    // マルチシグ情報の取得
    const msRes = await getMultisigInfo(address.toString())

    const metadatas = mdRes
      .map(
        (e: { metadataEntry: { scopedMetadataKey: string; value: string } }) => {
          return {
            key: e.metadataEntry.scopedMetadataKey,
            value: textDecoder.decode(
              Uint8Array.from(Buffer.from(e.metadataEntry.value, "hex")),
            ),
          }
        },
      )
      .sort((a: { key: string }, b: { key: string }) =>
        a.key.localeCompare(b.key),
      )

    const res = {
      address: address.toString(),
      metadata: metadatas,
      cosignatory: msRes.cosignatoryAddresses.map((cosignatory: string) =>
        decordHexAddress(cosignatory),
      ),
    }

    return c.json(res)
  } catch (error) {
    console.error("DAOデータ取得エラー:", error)
    return c.json({ message: "DAOデータの取得に失敗しました。" }, 500)
  }
}
