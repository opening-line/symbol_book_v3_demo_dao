import { Hono } from "hono"
import { createDao } from "./createDao"
import { getDao } from "./getDao"
import { getHolders } from "./getHolders"
import { addAdmin } from "./addAdmin"
import { deleteAdmin } from "./deleteAdmin"
import { getRewardInfo } from "./getRewardInfo"
import { createReward } from "./createReward"
import { sendReward } from "./sendReward"
import { getPointInfo } from "./getPointInfo"
import { createPoint } from "./createPoint"
import { sendPoint } from "./sendPoint"
import { revokePoint } from "./revokePoint"

const adminRoute = new Hono()

adminRoute.post("/new", createDao)
adminRoute.get("/get/:id", getDao)
adminRoute.get("/holders/:id/mosaic/:mosaicId", getHolders)
adminRoute.put("/add", addAdmin)
adminRoute.put("/delete", deleteAdmin)
adminRoute.get("/reward/:id", getRewardInfo)
adminRoute.post("/reward/create", createReward)
adminRoute.post("/reward/send", sendReward)
adminRoute.get("/point/:id", getPointInfo)
adminRoute.post("/point/create", createPoint)
adminRoute.post("/point/send", sendPoint)
adminRoute.post("/point/revoke", revokePoint)

export default adminRoute
