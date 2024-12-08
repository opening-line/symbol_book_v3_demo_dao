import { Hono } from "hono"
import { getTheme } from "./getTheme"
import { updateTheme } from "./updateTheme"

const limitedRoute = new Hono()

limitedRoute.get("/theme/:address", getTheme)
limitedRoute.put("/theme/update", updateTheme)

export default limitedRoute
