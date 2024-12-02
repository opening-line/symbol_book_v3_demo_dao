import { type models, type SymbolAccount } from "symbol-sdk/symbol"
import { signTransaction } from "./signTransaction"
import { Config } from "../utils/config"

export const announceTransaction = async (
  account: SymbolAccount,
  transaction: models.Transaction,
) => {
  const { hash, jsonPayload } = signTransaction(account, transaction)

  await fetch(new URL("/transactions", Config.NODE_URL), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: jsonPayload,
  }).then((res) => res.json())

  return {
    hash,
    jsonPayload,
  }
}