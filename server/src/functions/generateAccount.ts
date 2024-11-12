import { SymbolFacade } from "symbol-sdk/symbol"
import { Config } from "../utils/config"
import { PrivateKey } from "symbol-sdk"

export const generateAccount = () => {
  const facade = new SymbolFacade(Config.NETWORK)
  return facade.createAccount(PrivateKey.random())
}
