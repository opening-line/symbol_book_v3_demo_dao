import { PrivateKey } from "symbol-sdk"
import { SymbolFacade } from "symbol-sdk/symbol"
import { Config } from "../utils/config"

/**
 * アカウントの生成
 * @returns アカウント
 */
export const generateAccount = () => {
  const facade = new SymbolFacade(Config.NETWORK)
  return facade.createAccount(PrivateKey.random())
}
