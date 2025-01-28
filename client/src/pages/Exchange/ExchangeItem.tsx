import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { useTheme } from "../../components/ThemeContext"
import { Config } from "../../utils/config"
import { getActiveAddress } from "sss-module"

interface UserOwnedPointMosaic {
  amount: number
  id: string
  name: string
}

export const ExchangeItemPage: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { id, rewardMosaicId } = useParams<{
    id: string
    rewardMosaicId: string
  }>()

  const {
    name,
    balance,
    description,
    pointMosaicId,
    pointMosaicName,
    exchangeCost,
  } = location.state as {
    name: string
    balance: number
    description: string
    pointMosaicId: string
    pointMosaicName: string
    exchangeCost: number
  }
  const address = getActiveAddress()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [userOwnedPointMosaic, setUserOwnedPointMosaic] =
    useState<UserOwnedPointMosaic | null>(null)
  const [rewardMosaicAmount, setRewardMosaicAmount] = useState<number>(0)
  const [error, setError] = useState<string>("")
  const isDisabled = !rewardMosaicAmount || !!error || isLoading

  useEffect(() => {
    // ユーザーが保有しているポイントモザイクを取得
    const fetchMosaics = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          `${Config.API_HOST}/home/mosaics/${address}`,
        )
        const data = await response.json()

        // 交換対象のポイントモザイクを取得
        const targetMosaic = data.find(
          (mosaic: UserOwnedPointMosaic) => mosaic.id === pointMosaicId,
        )
        setUserOwnedPointMosaic(targetMosaic)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMosaics()
  }, [id])

  const handleRewardMosaicAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(e.target.value)
    setError("")

    if (value <= 8999999999) {
      if (value > balance) {
        setError("交換数が残数を超えています")
      } else {
        // 合計ポイントが保有ポイントを超過していないかチェック
        const totalPoints = value * exchangeCost
        if (totalPoints > (userOwnedPointMosaic?.amount || 0)) {
          setError("保有ポイントが不足しています")
        }
      }
      setRewardMosaicAmount(Number(e.target.value))
    }
  }

  const handleExchange = () => {
    setIsSubmitting(true)
    fetch(`${Config.API_HOST}/exchange/exchangeItem`, {
      method: "POST",
      body: JSON.stringify({
        daoId: id,
        toAddress: address,
        rewardMosaicId,
        rewardMosaicAmount: rewardMosaicAmount,
        pointMosaicId: userOwnedPointMosaic?.id,
        pointMosaicAmount: calculateTotalPoints(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message)
      })
      .catch((err) => {
        console.error(err)
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  // 合計ポイントを計算する関数
  const calculateTotalPoints = (): number => {
    const numAmount = rewardMosaicAmount || 0
    const totalPoints = numAmount * exchangeCost
    return totalPoints
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "24px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          overflow: "auto",
        }}
      >
        <div
          style={{
            marginBottom: "16px",
          }}
        >
          <button
            onClick={() => navigate(`/dao/${id}/exchange`)}
            style={{
              padding: "16px 0px",
              backgroundColor: theme.transparent,
              border: "none",
              color: theme.primary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ← 戻る
          </button>
        </div>
        <h1>アイテム交換</h1>

        <div
          style={{
            marginTop: "20px",
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              marginBottom: "4px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <label>交換アイテム：</label>
            <div style={{ flex: 1 }}>
              {name === rewardMosaicId
                ? rewardMosaicId
                : `${name} (${rewardMosaicId})`}
            </div>
          </div>

          <div
            style={{
              marginBottom: "4px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <label>交換アイテム詳細：</label>
            <div style={{ flex: 1 }}>{description}</div>
          </div>

          <div
            style={{
              marginBottom: "4px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <label>残数：</label>
            <div style={{ flex: 1 }}>{balance}</div>
          </div>

          <hr
            style={{
              width: "100%",
              border: "none",
              borderTop: `1px solid ${theme.border}`,
              margin: "0 0 4px 0",
            }}
          />

          <div
            style={{
              marginBottom: "4px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <label>交換に使用するポイント名：</label>
            <div style={{ flex: 1 }}>
              {pointMosaicName === pointMosaicId
                ? pointMosaicId
                : `${pointMosaicName} (${pointMosaicId})`}
            </div>
          </div>

          <div
            style={{
              marginBottom: "4px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <label>保有ポイント数：</label>
            <div style={{ flex: 1 }}>
              {isLoading ? (
                <span style={{ color: theme.disabled }}>読み込み中...</span>
              ) : (
                `${userOwnedPointMosaic?.amount?.toLocaleString() || 0} ポイント`
              )}
            </div>
          </div>

          <div
            style={{
              marginBottom: "4px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <label>必要なポイント数：</label>
            <div style={{ flex: 1 }}>{exchangeCost}</div>
          </div>

          <div
            style={{
              marginBottom: "4px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <label>交換するアイテム数：</label>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                height: "100%",
              }}
            >
              <input
                type='number'
                value={rewardMosaicAmount}
                onChange={handleRewardMosaicAmountChange}
                disabled={isLoading}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  backgroundColor: isLoading ? theme.disabled : theme.white,
                  border: "none",
                  width: "200px",
                  cursor: isLoading ? "not-allowed" : "text",
                }}
                placeholder='発行数を入力'
                min='0'
                max={balance}
              />
              {error && (
                <div style={{ color: "red", fontSize: "14px" }}>{error}</div>
              )}
            </div>
          </div>

          <hr
            style={{
              width: "100%",
              border: "none",
              borderTop: `1px solid ${theme.border}`,
              margin: "0 0 4px 0",
            }}
          />

          {/* 合計ポイント表示 */}
          <div
            style={{
              marginBottom: "4px",
              backgroundColor: theme.background,
              borderRadius: "4px",
              fontSize: "16px",
            }}
          >
            <div style={{ fontWeight: "bold" }}>使用ポイント合計</div>
            <div
              style={{
                marginTop: "8px",
                color: theme.primary,
                fontWeight: "bold",
              }}
            >
              {calculateTotalPoints().toLocaleString()} ポイント
            </div>
          </div>

          <div>
            <button
              onClick={handleExchange}
              disabled={isDisabled || balance === 0}
              style={{
                padding: "8px 16px",
                marginBottom: "20px",
                borderRadius: "4px",
                border: "none",
                backgroundColor:
                  isDisabled || isSubmitting || balance === 0 || isLoading
                    ? theme.disabled
                    : theme.primary,
                color: theme.white,
                cursor:
                  isDisabled || isSubmitting || balance === 0 || isLoading
                    ? "not-allowed"
                    : "pointer",
                width: "120px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {isSubmitting ? (
                <>
                  <div className='loader' />
                  処理中...
                </>
              ) : isLoading ? (
                "読み込み中..."
              ) : balance === 0 ? (
                "交換できません"
              ) : (
                "交換する"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
