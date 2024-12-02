import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Config } from "../../utils/config"

export const DaoPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [isDaoAccount, setIsDaoAccount] = useState<boolean>(false)

  useEffect(() => {
    const fetchDaoData = async () => {
      const response = await fetch(`${Config.API_HOST}/admin/get/${id}`).then(
        (res) => res.json(),
      )
      const isDaoAccount = !!response.address
      setIsDaoAccount(isDaoAccount)
    }

    fetchDaoData()
  }, [])

  return (
    <div>
      <h1>DAO設定</h1>
      {!isDaoAccount ? (
        // DAOアカウントがない場合
        <button
          onClick={() => navigate(`/dao/${id}/create`)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#181F39",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          DAOを作成する
        </button>
      ) : (
        // DAOアカウントがある場合
        <div>
          <h2>DAO管理者設定</h2>
          <p>このボタンからUpdate.tsxに遷移するようにしてるけど不要かも？</p>
          <p>
            サイドメニューから遷移する際にDAOあるかどうか判定して分岐させても良さそう？
          </p>
          <button
            onClick={() => navigate(`/dao/${id}/create`)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#181F39",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            DAO管理者を設定する
          </button>
        </div>
      )}
    </div>
  )
}
