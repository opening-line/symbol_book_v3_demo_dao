// TODO: NODE_URLをプロパティファイルから取得するよう変更
const NODE_URL = "https://sym-test-03.opening-line.jp:3001"

/**
 * モザイク情報を取得する
 * @param mosaicId モザイクID
 * @returns モザイク情報
 */
export const getMosaicInfo = async (mosaicId: string) => {
  return await fetch(new URL(`/mosaics/${mosaicId}`, NODE_URL), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => res.json())
}
