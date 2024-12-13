import {
  SymbolFacade,
  type models,
  type SymbolAccount,
} from "symbol-sdk/symbol"
import { Config } from "../utils/config"

/**
 * トランザクションの署名
 * @param account 署名者アカウント
 * @param transaction 署名対象トランザクション
 * @returns 署名されたトランザクションハッシュとペイロード
 */
export const signTransaction = (
  account: SymbolAccount,
  transaction: models.Transaction,
) => {
  const facade = new SymbolFacade(Config.NETWORK)
  const signature = account.signTransaction(transaction)
  const jsonPayload = facade.transactionFactory.static.attachSignature(
    transaction,
    signature,
  )
  const hash = facade.hashTransaction(transaction)

  return {
    hash,
    jsonPayload,
  }
}
