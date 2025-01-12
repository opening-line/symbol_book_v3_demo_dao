import { Hono } from "hono"
import { getExchangeItemInfo } from "./getExchangeItemInfo"
import { exchangeItem } from "./exchangeItem"

const exchangeRoute = new Hono()

exchangeRoute.get("/getItem/:id", getExchangeItemInfo)
exchangeRoute.post("/exchangeItem", exchangeItem)

export default exchangeRoute
