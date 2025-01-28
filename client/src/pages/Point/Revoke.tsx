import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useTheme } from "../../components/ThemeContext"
import { Config } from "../../utils/config"

export const PointRevokePage: React.FC = () => {
  const { theme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { id, mosaicId } = useParams<{ id: string; mosaicId: string }>()
  const { name } = location.state as { balance: number; name: string }
  const [holders, setHolders] = useState<{ address: string; amount: number }[]>(
    [],
  )
  const [selectedAddresses, setSelectedAddresses] = useState<string[]>([])
  const [amount, setAmount] = useState<number>(0)
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    // ポイント保有者一覧を取得
    const fetchHolders = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          `${Config.API_HOST}/admin/holders/${id}/mosaic/${mosaicId}`,
        ).then((res) => res.json())
        setHolders(response)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHolders()
  }, [mosaicId])

  const validateAmount = (value: number, addresses: string[]) => {
    if (value === 0) {
      setError("")
      return
    }

    if (isNaN(value)) {
      setError("数値を入力してください")
    } else if (value <= 0) {
      setError("0より大きい数値を入力してください")
    } else {
      // 選択された各ユーザーの保有量をチェック
      const invalidHolder = holders
        .filter((h) => addresses.includes(h.address))
        .find((h) => value > h.amount)

      if (invalidHolder) {
        setError(
          `回収数量が保有量（${invalidHolder.amount.toLocaleString()}）を超えるユーザーが存在します`,
        )
      } else {
        setError("")
      }
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    setAmount(value)
    validateAmount(value, selectedAddresses)
  }

  const handleCheckboxChange = (address: string) => {
    setSelectedAddresses((prev) => {
      const newAddresses = prev.includes(address)
        ? prev.filter((addr) => addr !== address)
        : [...prev, address]

      // 選択状態が変更されたら現在の入力値でバリデーション
      validateAmount(amount, newAddresses)
      return newAddresses
    })
  }

  const handleSelectAll = (checked: boolean) => {
    const newAddresses = checked ? holders.map((holder) => holder.address) : []
    setSelectedAddresses(newAddresses)
    // 全選択/解除時も現在の入力値でバリデーション
    validateAmount(amount, newAddresses)
  }

  const handleRevoke = () => {
    if (selectedAddresses.length === 0) {
      alert("回収元のアドレスを選択してください")
      return
    }

    setIsSubmitting(true)
    fetch(`${Config.API_HOST}/admin/point/revoke`, {
      method: "POST",
      body: JSON.stringify({
        daoId: id,
        mosaicId,
        sourceAddresses: selectedAddresses,
        amount,
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
            onClick={() => navigate(`/dao/${id}/point`)}
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

        <h1 style={{ margin: 0, marginBottom: "20px" }}>ポイント回収</h1>

        <label>
          回収するポイントモザイク：
          <span style={{ fontWeight: "bold" }}>
            {name === mosaicId ? mosaicId : `${name} (${mosaicId})`}
          </span>
        </label>
        <div
          style={{
            marginTop: "20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            height: "56px",
          }}
        >
          <label>回収数量：</label>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
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
                border: error ? `1px solid ${theme.alert}` : "none",
                width: "200px",
              }}
              min='1'
              placeholder='回収するポイント数を入力'
            />
            <div
              style={{
                height: "16px",
                fontSize: "12px",
                color: theme.alert,
              }}
            >
              {error}
            </div>
          </div>
        </div>

        <div>
          <div
            style={{
              backgroundColor: theme.white,
              padding: "12px",
              margin: "20px 0",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <input
                  type='checkbox'
                  checked={selectedAddresses.length === holders.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  disabled={isLoading}
                />
                <h2
                  style={{
                    margin: 0,
                    fontSize: "16px",
                  }}
                >
                  ポイント保有者一覧
                </h2>
              </div>
              <span style={{ fontSize: "14px", color: theme.text.placeholder }}>
                {selectedAddresses.length}件選択中
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    width: "100%",
                    textAlign: "center",
                    padding: "20px",
                    color: theme.text.placeholder,
                  }}
                >
                  読み込み中...
                </div>
              ) : holders.length === 0 ? (
                <div
                  style={{
                    width: "100%",
                    textAlign: "center",
                    padding: "20px",
                    color: theme.text.placeholder,
                  }}
                >
                  ポイント保有者がいません
                </div>
              ) : (
                holders.map((holder) => (
                  <div
                    key={holder.address}
                    style={{
                      padding: "12px",
                      border: `1px solid ${theme.border}`,
                      borderRadius: "4px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      width: "250px",
                      flex: "1 1 250px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        maxWidth: "100%",
                      }}
                    >
                      <input
                        type='checkbox'
                        checked={selectedAddresses.includes(holder.address)}
                        onChange={() => handleCheckboxChange(holder.address)}
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          maxWidth: "calc(100% - 24px)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            wordBreak: "break-all",
                            overflowWrap: "break-word",
                          }}
                        >
                          {holder.address}
                        </span>
                        <span
                          style={{
                            color: theme.text.placeholder,
                            fontSize: "12px",
                          }}
                        >
                          {holder.amount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          <button
            onClick={handleRevoke}
            disabled={
              !!error ||
              !amount ||
              selectedAddresses.length === 0 ||
              isSubmitting
            }
            style={{
              padding: "8px 16px",
              marginBottom: "20px",
              marginRight: "12px",
              backgroundColor:
                !!error ||
                !amount ||
                selectedAddresses.length === 0 ||
                isSubmitting
                  ? theme.disabled
                  : theme.primary,
              color: theme.white,
              border: "none",
              borderRadius: "4px",
              cursor:
                !!error ||
                !amount ||
                selectedAddresses.length === 0 ||
                isSubmitting
                  ? "not-allowed"
                  : "pointer",
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
              "回収する"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
