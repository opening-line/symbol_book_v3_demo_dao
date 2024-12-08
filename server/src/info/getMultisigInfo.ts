import { Config } from "../utils/config"

/**
 * アカウントのマルチシグ情報を取得する
 * @param address アドレス
 * @returns マルチシグ情報
 */
export const getMultisigInfo = async (address: string) => {
  return await fetch(new URL(`/account/${address}/multisig`, Config.NODE_URL), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => res.json().then((data) => data.multisig))
}
