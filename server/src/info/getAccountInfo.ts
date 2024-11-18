import { Config } from "../utils/config"

/**
 * アカウント情報を取得する
 * @param accountId アカウント公開鍵またはアドレス
 * @returns アカウント情報
 */
export const getAccountInfo = async (accountId: string) => {
  return await fetch(new URL(`/accounts/${accountId}`, Config.NODE_URL), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => res.json())
}
