import { utils } from "symbol-sdk"
import { models, Network, SymbolFacade } from "symbol-sdk/symbol"

import { setTransactionByPayload, requestSignCosignatureTransaction, getActivePublicKey } from "sss-module"
import { useState } from "react"

const NODE_URL = 'https://sym-test-03.opening-line.jp:3001'

export const CreateDAOPage: React.FC = () => {
  const [name, setName] = useState('');
  const sign = async () => {

    const ownerPublicKey = getActivePublicKey()

  const {payload} = await fetch("http://localhost:3000/admin/new", {
    method: 'POST',
    body: JSON.stringify({
      daoName: name,
      ownerPublicKey
    }),
  })
    .then(response => response.json())

    const facade = new SymbolFacade(Network.TESTNET)

    const tx = models.AggregateCompleteTransactionV2.deserialize(utils.hexToUint8(payload))
    setTransactionByPayload(payload)
      
    const cosignedTx = await requestSignCosignatureTransaction()
  
    const cosignature = new models.Cosignature()
    cosignature.signature.bytes = utils.hexToUint8(cosignedTx.signature)
    cosignature.signerPublicKey.bytes = utils.hexToUint8(cosignedTx.signerPublicKey)
    tx.cosignatures.push(cosignature)

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
  return (
    <div>
      <h1>CREATE DAO PAGE</h1>
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter DAO name"
          style={{ marginRight: '10px' }}
        />
        <button onClick={sign}>CREATE</button>
      </div>
    </div>
  );
}
