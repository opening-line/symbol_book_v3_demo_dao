import { Config } from "../utils/config"

/**
 * モザイク情報を取得する
 * @param mosaicId モザイクID
 * @returns モザイク情報
 */
export const getMosaicInfo = async (mosaicId: string) => {
  return await fetch(new URL(`/mosaics/${mosaicId}`, Config.NODE_URL), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => res.json().then((data) => data.mosaic))
}
