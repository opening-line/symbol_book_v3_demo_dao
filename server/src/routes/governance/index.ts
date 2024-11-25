import { Hono } from "hono"
import { createVote } from "./createVote"

const govenanceRoot = new Hono()

govenanceRoot.post("/new", createVote)

export default govenanceRoot
