import { utils } from "symbol-sdk"
import { Address, models, Network, SymbolFacade } from "symbol-sdk/symbol"

import {
  setTransactionByPayload,
  requestSignCosignatureTransaction,
  getActivePublicKey,
} from "sss-module"
import { useState } from "react"
import { Config } from "../../utils/config"

export const CreateDAOPage: React.FC = () => {
  const [name, setName] = useState("")
  const sign = async () => {
    const ownerPublicKey = getActivePublicKey()

    const { payload, daoId } = await fetch(`${Config.API_HOST}/admin/new`, {
      method: "POST",
      body: JSON.stringify({
        daoName: name,
        ownerPublicKey,
      }),
    }).then((response) => response.json())
    const facade = new SymbolFacade(Network.TESTNET)

    const tx = models.AggregateCompleteTransactionV2.deserialize(
      utils.hexToUint8(payload),
    )
    setTransactionByPayload(payload)

    const cosignedTx = await requestSignCosignatureTransaction()

    const cosignature = new models.Cosignature()
    cosignature.signature.bytes = utils.hexToUint8(cosignedTx.signature)
    cosignature.signerPublicKey.bytes = utils.hexToUint8(
      cosignedTx.signerPublicKey,
    )
    tx.cosignatures.push(cosignature)

    console.log("signer", tx.signerPublicKey.toString())
    console.log(
      "cosigner",
      tx.cosignatures.map((cosign) => cosign.signerPublicKey.toString()),
    )

    const jsonPayload2 = `{"payload":"${utils.uint8ToHex(tx.serialize())}"}`

    const hash = facade.hashTransaction(tx)

    const sendRes = await fetch(new URL("/transactions", Config.NODE_URL), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: jsonPayload2,
    }).then((res) => res.json())
    console.log(sendRes)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const statusRes = await fetch(
      new URL("/transactionStatus/" + hash, Config.NODE_URL),
    ).then((res) => res.json())
    console.log(statusRes)

    alert(`DAO created with id: ${daoId}`)
  }
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Create DAO Page</h1>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <input
          type='text'
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Enter DAO name'
          style={{ marginBottom: '10px', padding: '10px', width: '300px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button
          onClick={sign}
          style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', backgroundColor: '#007BFF', color: 'white', cursor: 'pointer' }}
        >
          Create DAO
        </button>
      </div>
    </div>
  )
}
