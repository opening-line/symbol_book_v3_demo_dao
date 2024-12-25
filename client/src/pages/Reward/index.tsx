import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTheme } from "../../components/ThemeContext"
import { Config } from "../../utils/config"

interface Mosaic {
  id: string
  maxSupply: number
  balance: number
  name?: string
}

export const RewardPage: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { id } = useParams()
  const [mosaics, setMosaics] = useState<Mosaic[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchRewardMosaics = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${Config.API_HOST}/admin/reward/${id}`)
        const mosaics = await response.json()
        setMosaics(mosaics)
      } catch (error) {
        console.error(error)
        alert("特典モザイクが見つかりませんでした。")
      } finally {
        setLoading(false)
      }
    }

    fetchRewardMosaics()
  }, [])

  const handleCreateClick = () => {
    navigate(`/dao/${id}/reward/create`)
  }

  const handleSendClick = (mosaic: Mosaic) => {
    navigate(`/dao/${id}/reward/send/${mosaic.id}`, {
      state: {
        balance: mosaic.balance,
        name: mosaic.name || "",
      },
    })
  }

  return (
    <div>
      <h1>特典管理</h1>
      <button
        style={{
          padding: "8px 16px",
          marginBottom: "20px",
          borderRadius: "4px",
          border: "none",
          backgroundColor: theme.primary,
          color: theme.white,
          cursor: "pointer",
          width: "100px",
        }}
        onClick={handleCreateClick}
      >
        新規作成
      </button>

      <div>
        <ul
          style={{
            backgroundColor: theme.white,
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
              特典モザイク一覧（{mosaics.length}件）
            </h2>
          </li>
          {loading ? (
            <li
              style={{
                padding: "24px",
                textAlign: "center",
              }}
            >
              <div>読み込み中...</div>
            </li>
          ) : (
            mosaics.map((mosaic, index) => (
              <li
                key={mosaic.id}
                style={{
                  padding: "12px",
                  borderBottom:
                    index === mosaics.length - 1
                      ? "none"
                      : `1px solid ${theme.border}`,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                <span>{mosaic.name}</span>
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
                      backgroundColor: theme.secondary,
                      color: theme.white,
                      cursor: "pointer",
                    }}
                    onClick={() => handleSendClick(mosaic)}
                  >
                    配布
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
