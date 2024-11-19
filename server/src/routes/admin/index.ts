import { Hono } from "hono"
import { createAdmin } from "./createAdmin"
import { addAdmin } from "./addAdmin"
import { deleteAdmin } from "./deleteAdmin"
import { getDao } from "./getDao"
import { sendReward } from "./sendReward"

const adminRoute = new Hono()

adminRoute.get("/get/:id", getDao)
adminRoute.post("/send", sendReward)
adminRoute.post("/new", createAdmin)
adminRoute.post("/add", addAdmin)
adminRoute.post("/delete", deleteAdmin)

export default adminRoute
