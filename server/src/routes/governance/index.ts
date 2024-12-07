import { Hono } from "hono"
import { createVote } from "./createVote"
import { voting } from "./voting"

const govenanceRoot = new Hono()

govenanceRoot.post("/new", createVote)
govenanceRoot.post("/vote", voting)

export default govenanceRoot
