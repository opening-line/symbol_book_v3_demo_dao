import { PrivateKey, utils } from "symbol-sdk"
import { models, Network, SymbolFacade } from "symbol-sdk/symbol"

const NODE_URL = 'https://sym-test-03.opening-line.jp:3001'

export const CreateDAOPage: React.FC = () => {
  const sign = async () => {

  const payload = await fetch("http://localhost:3000/admin/new", {
    method: 'POST',
    body: JSON.stringify({
      daoName: "test dao dao",
      ownerPublicKey: "7F544D00FD823B60EDE4CB604AA2366FA2AD20CF9A9C25BB41A1B15B99838397"
    }),
  })
    .then(response => response.json())

  console.log({payload})
  return

    const pk = '39324C83D5427071E2D56513558A56D50EF874A92CCD53F5AE7976AE1473BBA6'
    const facade = new SymbolFacade(Network.TESTNET)
    const acc = facade.createAccount(new PrivateKey(pk))

    const tx = models.AggregateCompleteTransactionV2.deserialize(utils.hexToUint8(payload))

    const cosign = facade.cosignTransaction(acc.keyPair, tx)

    tx.cosignatures.push(cosign)

    const jsonPayload2 = `{"payload":"${utils.uint8ToHex(tx.serialize())}"}`

    const hash = facade.hashTransaction(tx)

    const sendRes = await fetch(new URL("/transactions", NODE_URL), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: jsonPayload2,
    }).then((res) => res.json())
    console.log(sendRes)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const statusRes = await fetch(
      new URL("/transactionStatus/" + hash, NODE_URL),
    ).then((res) => res.json())
    console.log(statusRes)
      
  }
  return <div>CREATE DAO PAGE
    <button onClick={sign}>PUSH</button>
  </div>
}
