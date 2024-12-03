import { useEffect, useState } from "react"
import { Config } from "../../utils/config"
import { useNavigate } from "react-router-dom"

interface Mosaic {
  id: string
  maxSupply: number
  balance: number
}

export const PointPage: React.FC = () => {
  const [mosaics, setMosaics] = useState<Mosaic[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      // テスト用データ
      const response = [
        { id: "pointMosaicIdA", maxSupply: 1000000, balance: 1000 },
        { id: "pointMosaicIdB", maxSupply: 500000, balance: 500 },
        { id: "pointMosaicIdC", maxSupply: 100000, balance: 100 },
      ]

      // TODO: ポイントモザイク一覧取得APIに変更
      // const response = await fetch(`${Config.API_HOST}/points`);
      setMosaics(response)
    })()
  }, [])

  const handleDistribute = (mosaic: Mosaic) => {
    navigate(`/point/send/${mosaic.id}`, {
      state: {
        balance: mosaic.balance,
      },
    })
  }

  const handleCollect = (id: string) => {
    navigate(`/point/revoke/${id}`)
  }

  return (
    <div>
      <h1>ポイント管理</h1>
      <h2>TODO</h2>
      <p>・ポイント一覧取得AIを作成して呼び出す</p>
      <div>
        <ul
          style={{
            backgroundColor: "#FFFFFF",
            listStyle: "none",
            padding: 0,
            margin: 0,
            maxWidth: "600px",
            borderRadius: "8px",
          }}
        >
          <li
            style={{
              padding: "12px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "16px",
              }}
            >
              ポイントモザイク一覧（{mosaics.length}件）
            </h2>
          </li>
          {mosaics.map((mosaic, index) => (
            <li
              key={mosaic.id}
              style={{
                padding: "12px",
                borderBottom:
                  index === mosaics.length - 1 ? "none" : "1px solid #E0E0E0",
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "16px",
                alignItems: "center",
              }}
            >
              <span>{mosaic.id}</span>
              <span>
                {mosaic.balance.toLocaleString()}/
                {mosaic.maxSupply.toLocaleString()}
              </span>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  style={{
                    padding: "4px 12px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#4CAF50",
                    color: "#FFFFFF",
                    cursor: "pointer",
                  }}
                  onClick={() => handleDistribute(mosaic)}
                >
                  配布
                </button>
                <button
                  style={{
                    padding: "4px 12px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#F44336",
                    color: "#FFFFFF",
                    cursor: "pointer",
                  }}
                  onClick={() => handleCollect(mosaic.id)}
                >
                  回収
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
