import reactLogo from "./assets/react.svg"
import viteLogo from "/vite.svg"
import "./App.css"
import { KeyPair, SymbolFacade } from "symbol-sdk/symbol"
import { Network } from "symbol-sdk/nem"
import { PrivateKey } from "symbol-sdk"

function App() {
  const onClick = () => {
    const privateKey = import.meta.env.VITE_PRIVATE_KEY
    const account = new KeyPair(new PrivateKey(privateKey))
    const message = new Uint8Array([
      0x00,
      ...new TextEncoder().encode("test transaction"),
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

    fetch(
      new URL("/transactions", "https://sym-test-03.opening-line.jp:3001"),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: jsonPayload,
      },
    ).then((res) => res.json())
  }

  return (
    <>
      <div>
        <a href='https://vitejs.dev' target='_blank'>
          <img src={viteLogo} className='logo' alt='Vite logo' />
        </a>
        <a href='https://react.dev' target='_blank'>
          <img src={reactLogo} className='logo react' alt='React logo' />
        </a>
      </div>
      <h1>DEMO APP</h1>
      <div className='card'>
        <button onClick={onClick}>click</button>
      </div>
    </>
  )
}

export default App
