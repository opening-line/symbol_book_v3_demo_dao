import { Config } from "../utils/config"

/**
 * メタデータ情報を取得する
 * @param query 検索条件
 * @returns メタデータ情報
 */
export const getMetadataInfo = async (query: string) => {
  return await fetch(new URL(`/metadata?${query}`, Config.NODE_URL), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => res.json())
}
