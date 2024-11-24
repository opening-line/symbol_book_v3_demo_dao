import { Hono } from "hono"
import { getMemberMosaics } from "./getMemberMosaics"

const homeRoute = new Hono()

homeRoute.get("/mosaics/:address", getMemberMosaics)

export default homeRoute