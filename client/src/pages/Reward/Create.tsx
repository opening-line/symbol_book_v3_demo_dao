import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { useTheme } from "../../components/ThemeContext"
import { Config } from "../../utils/config"

export const RewardCreatePage: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [name, setName] = useState<string>("")
  const [amount, setAmount] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const isDisabled = !name || !amount

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    if (value <= 8999999999) {
      setAmount(value)
    }
  }

  const handleCreate = () => {
    setIsSubmitting(true)
    fetch(`${Config.API_HOST}/admin/reward/create`, {
      method: "POST",
      body: JSON.stringify({ daoId: id, mosaicName: name, amount }),
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
            onClick={() => navigate(`/dao/${id}/reward`)}
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
        <h1>特典作成</h1>

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
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              height: "36px",
            }}
          >
            <label>特典モザイク名：</label>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                height: "100%",
              }}
            >
              <input
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  backgroundColor: theme.white,
                  border: "none",
                  width: "200px",
                }}
                placeholder='特典モザイク名を入力'
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              height: "36px",
            }}
          >
            <label>発行数：</label>
            <div
              style={{
                display: "flex",
                gap: "8px",
                height: "100%",
              }}
            >
              <input
                type='number'
                value={amount}
                onChange={handleAmountChange}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  backgroundColor: theme.white,
                  border: "none",
                  width: "200px",
                }}
                placeholder='発行数を入力'
                min='0'
                max='8999999999'
              />
              <button
                onClick={() => setAmount(8999999999)}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  backgroundColor: theme.primary,
                  color: theme.white,
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                上限値を設定
              </button>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={isDisabled || isSubmitting}
            style={{
              padding: "8px 16px",
              marginBottom: "20px",
              borderRadius: "4px",
              border: "none",
              backgroundColor:
                isDisabled || isSubmitting ? theme.disabled : theme.primary,
              color: theme.white,
              cursor: isDisabled || isSubmitting ? "not-allowed" : "pointer",
              width: "100px",
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
            ) : (
              "作成する"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
