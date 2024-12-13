import dotenv from "dotenv"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { serve } from "@hono/node-server"
import adminRoute from "./routes/admin"
import gavarnanceRoute from "./routes/governance"
import homeRoute from "./routes/home"
import limitedRoute from "./routes/limited"

// 環境変数を読み込む
dotenv.config()

const app = new Hono()
app.use(
  cors({
    origin: ["http://localhost:5173"],
  }),
)

app.route("/admin", adminRoute)
app.route("/gavarnance", gavarnanceRoute)
app.route("/home", homeRoute)
app.route("/limited", limitedRoute)

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
