import { useEffect, useState } from "react"
import { Config } from "../../utils/config"
import { useParams, useNavigate } from "react-router-dom"

export const PointRevokePage: React.FC = () => {
  const HEADER_HEIGHT = 60
  const { mosaicId } = useParams<{ mosaicId: string }>()
  const navigate = useNavigate()
  const [holders, setHolders] = useState<{ address: string; amount: number }[]>(
    [],
  )
  const [selectedAddresses, setSelectedAddresses] = useState<string[]>([])
  const [amount, setAmount] = useState<string>("")
  const [error, setError] = useState<string>("")

  const validateAmount = (value: string, addresses: string[]) => {
    if (value === "") {
      setError("")
      return
    }

    const numValue = parseInt(value)
    if (isNaN(numValue)) {
      setError("数値を入力してください")
    } else if (numValue <= 0) {
      setError("0より大きい数値を入力してください")
    } else {
      // 選択された各ユーザーの保有量をチェック
      const invalidHolder = holders
        .filter((h) => addresses.includes(h.address))
        .find((h) => numValue > h.amount)

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
    const value = e.target.value
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
    // TODO: ポイント回収APIを呼び出す
    console.log("回収元アドレス:", selectedAddresses)
  }

  useEffect(() => {
    ;(async () => {
      // TODO: ポイントモザイク保有者一覧取得APIに変更
      // テスト用データ
      const response = [
        { address: "ユーザー1", amount: 1000 },
        { address: "ユーザー2", amount: 500 },
        { address: "ユーザー3", amount: 100 },
      ]

      // const response = await fetch(`${Config.API_HOST}/point/holders`);
      setHolders(response)
    })()
  }, [])

  return (
    <div
      style={{
        display: "flex",
        gap: "24px",
        minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
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
            onClick={() => navigate("/point")}
            style={{
              padding: "16px 0px",
              backgroundColor: "transparent",
              border: "none",
              color: "#0C1228",
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
          回収するポイントID：
          <span style={{ fontWeight: "bold" }}>{mosaicId}</span>
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
          <label
            style={{
              marginTop: "4px",
            }}
          >
            回収数量：
          </label>
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
                backgroundColor: "#FFFFFF",
                border: error ? "1px solid #F44336" : "none",
                width: "200px",
              }}
              min='1'
              placeholder='回収するポイント数を入力'
            />
            <div
              style={{
                height: "16px",
                fontSize: "12px",
                color: "#F44336",
              }}
            >
              {error}
            </div>
          </div>
        </div>

        <div>
          <div
            style={{
              backgroundColor: "#FFFFFF",
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
              <span style={{ fontSize: "14px", color: "#666666" }}>
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
              {holders.map((holder) => (
                <div
                  key={holder.address}
                  style={{
                    padding: "12px",
                    border: "1px solid #E0E0E0",
                    borderRadius: "4px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "calc(33.33% - 8px)",
                    minWidth: "auto",
                    flex: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type='checkbox'
                      checked={selectedAddresses.includes(holder.address)}
                      onChange={() => handleCheckboxChange(holder.address)}
                    />
                    <span>{holder.address}</span>
                  </div>
                  <span>{holder.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          <button
            onClick={handleRevoke}
            disabled={!!error || !amount || selectedAddresses.length === 0}
            style={{
              padding: "8px 16px",
              marginBottom: "20px",
              marginRight: "12px",
              backgroundColor:
                !!error || !amount || selectedAddresses.length === 0
                  ? "#CCCCCC"
                  : "#0C1228",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                !!error || !amount || selectedAddresses.length === 0
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            回収する
          </button>
        </div>
      </div>
    </div>
  )
}
