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

export const PointPage: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [mosaics, setMosaics] = useState<Mosaic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPointMosaics = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${Config.API_HOST}/admin/point/${id}`)
        const mosaics = await response.json()
        setMosaics(mosaics)
      } catch (error) {
        console.error(error)
        alert("ポイントモザイクが見つかりませんでした。")
      } finally {
        setLoading(false)
      }
    }

    fetchPointMosaics()
  }, [id])

  const handleCreateClick = () => {
    navigate(`/dao/${id}/point/create`)
  }

  const handleSendClick = (mosaic: Mosaic) => {
    navigate(`/dao/${id}/point/send/${mosaic.id}`, {
      state: {
        balance: mosaic.balance,
        name: mosaic.name || "",
      },
    })
  }

  const handleRevokeClick = (mosaic: Mosaic) => {
    navigate(`/dao/${id}/point/revoke/${mosaic.id}`, {
      state: {
        name: mosaic.name || "",
      },
    })
  }

  return (
    <div>
      <h1>ポイント管理</h1>
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
              ポイントモザイク一覧（{mosaics.length}件）
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
                  <button
                    style={{
                      padding: "4px 12px",
                      borderRadius: "4px",
                      border: `1px solid ${theme.secondary}`,
                      backgroundColor: theme.transparent,
                      color: theme.secondary,
                      cursor: "pointer",
                    }}
                    onClick={() => handleRevokeClick(mosaic)}
                  >
                    回収
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
