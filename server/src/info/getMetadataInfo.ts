// TODO: NODE_URLをプロパティファイルから取得するよう変更
const NODE_URL = "https://sym-test-03.opening-line.jp:3001"

/**
 * メタデータ情報を取得する
 * @param query 検索条件
 * @returns メタデータ情報
 */
export const getMetadataInfo = async (query: string) => {
  return await fetch(new URL(`/metadata?${query}`, NODE_URL), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => res.json())
}
