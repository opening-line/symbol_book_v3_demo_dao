import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { PrivateKey } from "symbol-sdk"
import { Network } from "symbol-sdk/nem"
import { KeyPair, SymbolFacade } from "symbol-sdk/symbol"
import dotenv from "dotenv"
import { env } from "hono/adapter"
import adminRoute from "./routes/admin"
import { cors } from "hono/cors"
// 環境変数を読み込む
dotenv.config()

const app = new Hono()
app.use(
  cors({
    origin: ["http://localhost:5173"],
  }),
)

app.route("/admin", adminRoute)

app.get("/", (c) => {
  return c.text("Hello Hono!")
})
app.get("/tx", (c) => {
  const ENV = env<{ PRIVATE_KEY: string }>(c)
  console.log(ENV.PRIVATE_KEY)

  const account = new KeyPair(new PrivateKey(ENV.PRIVATE_KEY))
  const message = new Uint8Array([
    0x00,
    ...new TextEncoder().encode("test transaction from hono"),
  ])

  const facade = new SymbolFacade(Network.TESTNET.toString())

  const tx = facade.transactionFactory.create({
    type: "transfer_transaction_v1",
    signerPublicKey: account.publicKey,
    deadline: facade.now().addHours(2).timestamp,
    recipientAddress: facade.network.publicKeyToAddress(account.publicKey),
    mosaics: [],
    message,
    fee: 1000000n,
  })
  const signature = facade.signTransaction(account, tx)
  const jsonPayload = facade.transactionFactory.static.attachSignature(
    tx,
    signature,
  )

  console.log({ jsonPayload })

  fetch(new URL("/transactions", "https://sym-test-03.opening-line.jp:3001"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: jsonPayload,
  }).then((res) => res.json())

  return c.text("Hello Hono!")
})

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
