import { useEffect, useState } from "react"
import { useNavigate, useOutletContext, useParams } from "react-router-dom"
import { useTheme } from "../../components/ThemeContext"
import { Config } from "../../utils/config"
import { LayoutContextType } from "../../components/Layout"

interface Mosaic {
  id: string
  maxSupply: number
  balance: number
  name?: string
}

interface ExchangeItem {
  mosaic: Mosaic
  pointMosaicId: string
  pointMosaicName: string
  description: string
  exchangeCost: number
}

export const ExchangePage: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [exchangeItems, setExchangeItems] = useState<ExchangeItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { isManagerAccount } = useOutletContext<LayoutContextType>()

  useEffect(() => {
    const fetchExchangeItem = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          `${Config.API_HOST}/exchange/getItem/${id}`,
        )
        const exchangeItems = await response.json()
        setExchangeItems(exchangeItems)
      } catch (error) {
        console.error(error)
        alert("交換アイテムが見つかりませんでした。")
      } finally {
        setIsLoading(false)
      }
    }

    fetchExchangeItem()
  }, [id])

  const handleCreateExchangeItemClick = () => {
    navigate(`/dao/${id}/exchange/createItem`)
  }

  const handleExchangeClick = (exchangeItem: ExchangeItem) => {
    navigate(`/dao/${id}/exchange/${exchangeItem.mosaic.id}`, {
      state: {
        name: exchangeItem.mosaic.name || "",
        balance: exchangeItem.mosaic.balance,
        description: exchangeItem.description,
        pointMosaicId: exchangeItem.pointMosaicId,
        pointMosaicName: exchangeItem.pointMosaicName,
        exchangeCost: exchangeItem.exchangeCost,
      },
    })
  }

  return (
    <div>
      <h1>ポイント交換</h1>
      {/* dao管理者のみ新規作成ボタンを表示 */}
      {isManagerAccount && (
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
          onClick={handleCreateExchangeItemClick}
        >
          新規作成
        </button>
      )}

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
              交換アイテム一覧（{exchangeItems.length}件）
            </h2>
          </li>
          {isLoading ? (
            <li
              style={{
                padding: "24px",
                textAlign: "center",
              }}
            >
              <div>
                <span style={{ color: theme.disabled }}>読み込み中...</span>
              </div>
            </li>
          ) : (
            exchangeItems.map((exchangeItem, index) => (
              <li
                key={exchangeItem.mosaic.id}
                style={{
                  padding: "12px",
                  borderBottom:
                    index === exchangeItems.length - 1
                      ? "none"
                      : `1px solid ${theme.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                  {exchangeItem.mosaic.name}
                </div>
                <div>
                  <span style={{ marginRight: "8px" }}>・残数:</span>
                  {exchangeItem.mosaic.balance.toLocaleString()}/
                  {exchangeItem.mosaic.maxSupply.toLocaleString()}
                </div>
                <div>
                  <span style={{ marginRight: "8px" }}>
                    ・交換対象ポイント:
                  </span>
                  {exchangeItem.pointMosaicName === exchangeItem.pointMosaicId
                    ? exchangeItem.pointMosaicId
                    : `${exchangeItem.pointMosaicName} (${exchangeItem.pointMosaicId})`}
                </div>
                <div>
                  <span style={{ marginRight: "8px" }}>・必要ポイント数:</span>
                  {exchangeItem.exchangeCost}
                </div>
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
                    onClick={() => handleExchangeClick(exchangeItem)}
                  >
                    詳細
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
