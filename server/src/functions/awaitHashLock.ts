import { Config } from "../utils/config"

export const awaitHashLock = async (txHash: string) => {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < 100; i++) {
      await new Promise((res) => setTimeout(res, 1000))
      const hashLockStatus = await fetch(
        new URL("/transactionStatus/" + txHash, Config.NODE_URL),
      ).then((res) => res.json())
      if (hashLockStatus.group === "confirmed") {
        resolve({})
      }
    }
    reject()
  })
}
