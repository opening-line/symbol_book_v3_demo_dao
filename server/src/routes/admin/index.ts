import { Hono } from "hono"
import { createAdmin } from "./createAdmin"

const adminRoute = new Hono()

adminRoute.post("/new", createAdmin)

export default adminRoute
