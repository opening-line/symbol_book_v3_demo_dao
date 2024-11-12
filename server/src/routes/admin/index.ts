import { Hono } from "hono"
import { createAdmin } from "./createAdmin"
import { addAdmin } from "./addAdmin"
import { deleteAdmin } from "./deleteAdmin"

const adminRoute = new Hono()

adminRoute.post("/new", createAdmin)
adminRoute.post("/add", addAdmin)
adminRoute.post("/delete", deleteAdmin)

export default adminRoute
