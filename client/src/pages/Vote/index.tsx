import { useState } from "react"
import { useParams } from "react-router"
import { Config } from "../../utils/Config"

export const VotePage: React.FC = () => {
  const { id } = useParams()
  const [title, setTitle] = useState("")
  const [voteA, setVoteA] = useState("")
  const [voteB, setVoteB] = useState("")
  const [voteC, setVoteC] = useState("")
  const [voteD, setVoteD] = useState("")

  const handleCreateVote = () => {
    fetch(`${Config.API_HOST}/gavarnance/new`, {
      method: "POST",
      body: JSON.stringify({
        daoId: id,
        title: "Test",
        voteA,
        voteB,
        voteC,
        voteD
      }),
    })
  }

  return (
    <div>
      <h1>Create Vote Page</h1>
      <input
        type='text'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder='Enter title'
      />
      <input
        type='text'
        value={voteA}
        onChange={(e) => setVoteA(e.target.value)}
        placeholder='Enter A'
      />
      <input
        type='text'
        value={voteB}
        onChange={(e) => setVoteB(e.target.value)}
        placeholder='Enter B'
      />
      <input
        type='text'
        value={voteC}
        onChange={(e) => setVoteC(e.target.value)}
        placeholder='Enter C'
      />
      <input
        type='text'
        value={voteD}
        onChange={(e) => setVoteD(e.target.value)}
        placeholder='Enter D'
      />
      <button onClick={handleCreateVote}>Create Vote</button>
    </div>
  )
}
