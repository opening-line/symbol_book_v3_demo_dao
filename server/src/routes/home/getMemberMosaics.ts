import type { Context } from "hono"
import { getAccountInfo } from "../../info/getAccountInfo"
import { getMosaicInfo } from "../../info/getMosaicInfo"
import { convertToMosaicActualAmount } from "../../utils/mosaicUtils"

export const getMemberMosaics = async (c: Context) => {
  try {
    const address = c.req.param("address")
    const res = await getAccountInfo(address)

    const mosaics = await Promise.all(
      res.mosaics.map(async (mosaic: { id: string; amount: string }) => {
        const mosaicInfo = await getMosaicInfo(mosaic.id)
        return {
          id: mosaic.id,
          amount: convertToMosaicActualAmount(
            mosaic.amount,
            mosaicInfo.divisibility,
          ),
        }
      }),
    )

    return c.json(mosaics)
  } catch (error) {
    console.error("Error fetching member mosaics:", error)
    return c.json({ error: "Failed to fetch member mosaics" }, 500)
  }
}
