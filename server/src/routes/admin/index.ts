import { Hono } from "hono"
import { createDao } from "./createDao"
import { addAdmin } from "./addAdmin"
import { deleteAdmin } from "./deleteAdmin"
import { getDao } from "./getDao"
import { sendReward } from "./sendReward"
import { revokePoint } from "./revokePoint"
import { getHolders } from "./getHolders"
import { sendPoint } from "./sendPoint"
import { getPointInfo } from "./getPointInfo"
import { createPoint } from "./createPoint"
import { createReward } from "./createReward"
import { getRewardInfo } from "./getRewardInfo"

const adminRoute = new Hono()

adminRoute.get("/get/:id", getDao)
adminRoute.post("/send", sendReward)
adminRoute.post("/new", createDao)
adminRoute.put("/add", addAdmin)
adminRoute.put("/delete", deleteAdmin)
adminRoute.get("/reward/:id", getRewardInfo)
adminRoute.post("/reward/create", createReward)
adminRoute.post("/reward/send", sendReward)
adminRoute.get("/point/:id", getPointInfo)
adminRoute.post("/point/create", createPoint)
adminRoute.post("/point/send", sendPoint)
adminRoute.post("/point/revoke", revokePoint)
adminRoute.get("/holders/:id/mosaic/:mosaicId", getHolders)

export default adminRoute
