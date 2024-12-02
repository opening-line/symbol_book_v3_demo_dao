import { Config } from "../utils/config"

export const announceBonded = async (txHash: string, bondedPayload: string) => {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < 100; i++) {
      await new Promise((res) => setTimeout(res, 1000))
      const hashLockStatus = await fetch(
        new URL("/transactionStatus/" + txHash, Config.NODE_URL),
      ).then((res) => res.json())
      if (hashLockStatus.group === "confirmed") {
        await fetch(new URL("/transactions/partial", Config.NODE_URL), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: bondedPayload,
        }).then((res) => resolve(res.json()))
      }
    }
    reject()
  })
}