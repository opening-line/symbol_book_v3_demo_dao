import { useState } from "react";
import { useParams } from "react-router";
import { Config } from "../../utils/Config";

export const RewardPaga: React.FC = () => {
  const { id } = useParams();
  const [recipient, setRecipient] = useState('');

  const handleSendReward = () => {
    fetch(`${Config.API_HOST}/admin/send`, {
      method: 'POST',
      body: JSON.stringify({
        daoId: id,
        to: recipient,
        amount: 1
      }),
    })
  };



  return (
    <div>
      <h1>Reward Page</h1>
      <input
        type="text"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="Enter recipient address"
      />
      <button onClick={handleSendReward}>Send Reward</button>
    </div>
  )
}