import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { Config } from "../../utils/config"
import { PublicKey, utils } from "symbol-sdk"
import {
  Address,
  models,
  Network,
  SymbolFacade,
  SymbolPublicAccount,
} from "symbol-sdk/symbol"
import {
  getActiveAddress,
  getActivePublicKey,
  requestSignCosignatureTransaction,
  setTransactionByPayload,
} from "sss-module"
import { useTheme } from "../../components/ThemeContext"
type Vote = {
  title: string
  a: string
  b: string
  c: string
  d: string
  token: string
  version: string
}

type Acc = {
  address: string
  mosaics: {
    id: string
    amount: number
  }[]
}

type Metadata = { key: string; value: string }
export const GovernanceVotingPage: React.FC = () => {
  const {theme} = useTheme()
  const { id } = useParams()
  const [title, setTitle] = useState<string>("")
  const [voteA, setVoteA] = useState<string>("")
  const [voteB, setVoteB] = useState<string>("")
  const [voteC, setVoteC] = useState<string>("")
  const [voteD, setVoteD] = useState<string>("")
  const [index, setIndex] = useState<number>(-1)

  const [votes, setVotes] = useState<Vote[]>([])
  const [voteAccounts, setVoteAccounts] = useState<Acc[]>([])
  const [voteMosaics, setVoteMosaics] = useState<
    {
      id: string
      amount: number
    }[]
  >([])

  const [metadatas, setMetadatas] = useState<
    {
      key: number
      value: string
    }[]
  >([])

  useEffect(() => {
    fetch(`${Config.API_HOST}/admin/get/${id}`)
      .then((res) => res.json())
      .then(async (data) => {
        const d = data.metadata.map((md: Metadata) => {
          return {
            key: parseInt(md.key),
            value: md.value,
          }
        })
        setMetadatas(d)

        const transactionIds = d
          .filter((md: { key: number }) => md.key >= 63)
          .map((md: Metadata) => md.value)

        fetch(`${Config.NODE_URL}/transactions/confirmed`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionIds,
          }),
        })
          .then((res) => res.json())
          .then((res) => {
            const msgs = res.map(
              (r: any) => r.transaction.transactions[0].transaction.message,
            )
            const messages = msgs.map((msg: string) => {
              const m = new TextDecoder().decode(utils.hexToUint8(msg))
              return JSON.parse(m.replace("\x00", ""))
            })

            console.log(messages)

            fetch(`${Config.NODE_URL}/accounts`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                publicKeys: [d[0].value, d[1].value, d[2].value, d[3].value],
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                console.log(data[0].account)
                const a = data.map((d: any) => {
                  return {
                    address: Address.fromDecodedAddressHexString(
                      d.account.address,
                    ).toString(),
                    mosaics: d.account.mosaics.map((m: any) => {
                      return {
                        id: m.id,
                        amount: m.amount,
                      }
                    }),
                  }
                })
                console.log(a)
                setVoteAccounts(a)
              })

            fetch(`${Config.NODE_URL}/accounts/${getActiveAddress()}`)
              .then((res) => res.json())
              .then((data) => {
                console.log(data)
                const mosaics = data.account.mosaics.filter(
                  (m: { id: string }) => {
                    return messages
                      .map((m: any) =>
                        BigInt(m.token).toString(16).toUpperCase(),
                      )
                      .includes(m.id)
                  },
                )
                console.log({ mosaics })
                setVoteMosaics(mosaics)
              })
            console.log({ messages })
            setVotes(messages)
          })
      })
  }, [])

  const handleCreateVote = () => {
    fetch(`${Config.API_HOST}/governance/new`, {
      method: "POST",
      body: JSON.stringify({
        daoId: id,
        title,
        voteA,
        voteB,
        voteC,
        voteD,
      }),
    })
  }

  const vote = async (i: number) => {
    const v = metadatas[i]
    const mosaicId = BigInt(votes[index].token).toString(16).toUpperCase()
    console.log(voteMosaics)
    const mosaic = voteMosaics.find((m) => m.id === mosaicId) as {
      id: string
      amount: number
    }
    console.log(mosaic)
    const { payload } = await fetch(`${Config.API_HOST}/governance/vote`, {
      method: "POST",
      body: JSON.stringify({
        daoId: id,
        token: votes[index].token,
        publicKey: v.value,
        userKey: getActivePublicKey(),
        amount: mosaic.amount,
      }),
    }).then((res) => res.json())

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
  }

  return (
    <div style={{ padding: "20px", paddingRight: "40px", backgroundColor: theme.background }}>
      <h2 style={{ color: theme.primary }}>Create Vote</h2>
      <div style={{ marginBottom: "20px" }}>
        <input
          type='text'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Enter title'
          style={{ padding: "10px", marginBottom: "10px", width: "100%", backgroundColor: theme.white, border: `1px solid ${theme.border}` }}
        />
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type='text'
            value={voteA}
            onChange={(e) => setVoteA(e.target.value)}
            placeholder='Enter A'
            style={{ padding: "10px", flex: 1, backgroundColor: theme.white, border: `1px solid ${theme.border}` }}
          />
          <input
            type='text'
            value={voteB}
            onChange={(e) => setVoteB(e.target.value)}
            placeholder='Enter B'
            style={{ padding: "10px", flex: 1, backgroundColor: theme.white, border: `1px solid ${theme.border}` }}
          />
          <input
            type='text'
            value={voteC}
            onChange={(e) => setVoteC(e.target.value)}
            placeholder='Enter C'
            style={{ padding: "10px", flex: 1, backgroundColor: theme.white, border: `1px solid ${theme.border}` }}
          />
          <input
            type='text'
            value={voteD}
            onChange={(e) => setVoteD(e.target.value)}
            placeholder='Enter D'
            style={{ padding: "10px", flex: 1, backgroundColor: theme.white, border: `1px solid ${theme.border}` }}
          />
        </div>
        <button
          onClick={handleCreateVote}
          style={{
            padding: "10px 20px",
            backgroundColor: theme.secondary,
            color: theme.white,
            border: "none",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          Create Vote
        </button>
      </div>

      <h2 style={{ color: theme.primary }}>Vote List</h2>
      <div>
        {votes.map((vote, i) => {
          const hasMosaic = voteMosaics.some(
            (mosaic) =>
              mosaic.id === BigInt(vote.token).toString(16).toUpperCase(),
          )
          const facade = new SymbolFacade(Config.NETWORK)
          const a = voteAccounts.find(
            (acc) =>
              acc.address ===
              new SymbolPublicAccount(
                facade,
                new PublicKey(metadatas[0].value),
              ).address.toString(),
          )
          const b = voteAccounts.find(
            (acc) =>
              acc.address ===
              new SymbolPublicAccount(
                facade,
                new PublicKey(metadatas[1].value),
              ).address.toString(),
          )
          const c = voteAccounts.find(
            (acc) =>
              acc.address ===
              new SymbolPublicAccount(
                facade,
                new PublicKey(metadatas[2].value),
              ).address.toString(),
          )
          const d = voteAccounts.find(
            (acc) =>
              acc.address ===
              new SymbolPublicAccount(
                facade,
                new PublicKey(metadatas[3].value),
              ).address.toString(),
          )

          const aa = a?.mosaics.find(
            (m) => m.id === BigInt(vote.token).toString(16).toUpperCase(),
          )?.amount
          const bb = b?.mosaics.find(
            (m) => m.id === BigInt(vote.token).toString(16).toUpperCase(),
          )?.amount
          const cc = c?.mosaics.find(
            (m) => m.id === BigInt(vote.token).toString(16).toUpperCase(),
          )?.amount
          const dd = d?.mosaics.find(
            (m) => m.id === BigInt(vote.token).toString(16).toUpperCase(),
          )?.amount
          return (
            <div
              key={vote.token}
              style={{
                padding: "10px",
                border: `1px solid ${theme.border}`,
                marginBottom: "10px",
                cursor: "pointer",
                backgroundColor: hasMosaic ? theme.background : "transparent",
              }}
              onClick={() => setIndex(hasMosaic ? i : -1)}
            >
              <p>{vote.title}</p>
              <div>
                <div>{metadatas[0].value}</div>
                <div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>A: {vote.a}</span>{" "}
                    {a && aa !== undefined && <span>{aa}票</span>}
                  </div>

                  <div>
                    <span>B: {vote.b}</span>{" "}
                    {b && bb !== undefined && <span>{bb}票</span>}
                  </div>
                  <div>
                    <span>C: {vote.c}</span>{" "}
                    {c && cc !== undefined && <span>{cc}票</span>}
                  </div>
                  <div>
                    <span>D: {vote.d}</span>{" "}
                    {d && dd !== undefined && <span>{dd}票</span>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {index !== -1 && (
        <div style={{ marginTop: "20px" }}>
          <h2 style={{ color: theme.primary }}>{votes[index].title}</h2>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            {votes[index].a !== "" && (
              <div
                style={{ padding: "10px", border: `1px solid ${theme.border}`, flex: 1 }}
              >
                <p>A: {votes[index].a}</p>
                <button
                  onClick={() => vote(0)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: theme.secondary,
                    color: theme.white,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Vote
                </button>
              </div>
            )}
            {votes[index].b !== "" && (
              <div
                style={{ padding: "10px", border: `1px solid ${theme.border}`, flex: 1 }}
              >
                <p>B: {votes[index].b}</p>
                <button
                  onClick={() => vote(1)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: theme.secondary,
                    color: theme.white,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Vote
                </button>
              </div>
            )}
            {votes[index].c !== "" && (
              <div
                style={{ padding: "10px", border: `1px solid ${theme.border}`, flex: 1 }}
              >
                <p>C: {votes[index].c}</p>
                <button
                  onClick={() => vote(2)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: theme.secondary,
                    color: theme.white,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Vote
                </button>
              </div>
            )}

            {votes[index].d !== "" && (
              <div
                style={{ padding: "10px", border: `1px solid ${theme.border}`, flex: 1 }}
              >
                <p>D: {votes[index].d}</p>
                <button
                  onClick={() => vote(3)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: theme.secondary,
                    color: theme.white,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Vote
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
