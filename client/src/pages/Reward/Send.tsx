import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useTheme } from "../../components/ThemeContext"
import { Config } from "../../utils/config"

export const RewardSendPage: React.FC = () => {
  const { theme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { id, mosaicId } = useParams<{ id: string; mosaicId: string }>()
  const { balance, name } = location.state as { balance: number; name: string }
  const [holders, setHolders] = useState<{ address: string; amount: number }[]>(
    [],
  )
  const [selectedAddresses, setSelectedAddresses] = useState<string[]>([])
  const [amount, setAmount] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [accountValidationError, setAccountValidationError] =
    useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [manualAddress, setManualAddress] = useState<string>("")
  const [manualAddressError, setManualAddressError] = useState<string>("")
  const [manualAddresses, setManualAddresses] = useState<string[]>([])

  useEffect(() => {
    // 特典保有者一覧を取得
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
  }, [mosaicId, balance])

  useEffect(() => {
    if (selectedAddresses.length > 99) {
      setAccountValidationError("選択できるユーザーは99名までです。")
    } else {
      setAccountValidationError("")
    }
  }, [selectedAddresses])

  useEffect(() => {
    if (amount && selectedAddresses.length > 0) {
      const numValue = parseInt(amount)
      if (numValue * selectedAddresses.length > balance) {
        setError(
          `選択された${selectedAddresses.length}名に${numValue.toLocaleString()}ずつ配布すると、合計${(numValue * selectedAddresses.length).toLocaleString()}となり配布可能な残高（${balance.toLocaleString()}）を超えています`,
        )
      } else {
        setError("")
      }
    }
  }, [selectedAddresses, amount, balance])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(value)

    if (value === "") {
      setError("")
    } else {
      const numValue = parseInt(value)
      if (isNaN(numValue)) {
        setError("数値を入力してください")
      } else if (numValue <= 0) {
        setError("0より大きい数値を入力してください")
      } else if (numValue > balance) {
        setError(`配布可能な残高（${balance.toLocaleString()}）を超えています`)
      } else if (
        selectedAddresses.length > 0 &&
        numValue * selectedAddresses.length > balance
      ) {
        setError(
          `選択された${selectedAddresses.length}名に${numValue.toLocaleString()}ずつ配布すると、合計${(numValue * selectedAddresses.length).toLocaleString()}となり配布可能な残高（${balance.toLocaleString()}）を超えています`,
        )
      } else {
        setError("")
      }
    }
  }

  const handleCheckboxChange = (address: string) => {
    setSelectedAddresses((prev) => {
      const newSelection = prev.includes(address)
        ? prev.filter((addr) => addr !== address)
        : [...prev, address]
      return newSelection
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allAddresses = [...holders.map(holder => holder.address), ...manualAddresses]
      setSelectedAddresses(allAddresses)
    } else {
      setSelectedAddresses([])
    }
  }

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
  }

  const handleSend = () => {
    setIsSubmitting(true)
    fetch(`${Config.API_HOST}/admin/reward/send`, {
      method: "POST",
      body: JSON.stringify({
        daoId: id,
        mosaicId,
        recipientsAddresses: selectedAddresses,
        amount,
        message,
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

  const handleManualAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setManualAddress(value)
    setManualAddressError("")
  }

  const handleAddManualAddress = () => {
    if (!manualAddress) {
      setManualAddressError("アドレスを入力してください")
      return
    }
    
    if (selectedAddresses.includes(manualAddress) || manualAddresses.includes(manualAddress)) {
      setManualAddressError("このアドレスは既に追加されています")
      return
    }

    setManualAddresses(prev => [...prev, manualAddress])
    setSelectedAddresses(prev => [...prev, manualAddress])
    setManualAddress("")
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

        <h1 style={{ margin: 0, marginBottom: "20px" }}>報酬配布</h1>

        <label>
          配布する報酬モザイク：
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
          <label
            style={{
              marginTop: "4px",
            }}
          >
            配布数量：　
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
                backgroundColor: theme.white,
                border: error ? `1px solid ${theme.alert}` : "none",
                width: "200px",
              }}
              min='1'
              max={balance.toString()}
              placeholder='配布する特典数を入力'
            />
            <span
              style={{
                color: theme.text.placeholder,
                fontSize: "12px",
              }}
            >
              上限：{balance.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              height: "16px",
              fontSize: "12px",
              color: theme.alert,
              marginTop: "4px",
            }}
          >
            {error}
          </div>
        </div>

        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <label style={{ marginTop: "4px" }}>メッセージ：</label>
          <textarea
            value={message}
            onChange={handleMessageChange}
            style={{
              padding: "8px",
              borderRadius: "4px",
              backgroundColor: theme.white,
              border: "none",
              width: "400px",
              minHeight: "80px",
              resize: "vertical",
              fontSize: "14px",
              fontWeight: "normal",
            }}
            placeholder='配布時のメッセージを入力（任意）'
          />
        </div>

        <div>
          <div
            style={{
              backgroundColor: theme.white,
              padding: "12px",
              margin: "0 0 20px 0",
              borderRadius: "8px"
            }}
          >
            <h2 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>
              アドレスを手動で追加
            </h2>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <input
                type="text"
                value={manualAddress}
                onChange={handleManualAddressChange}
                placeholder="アドレスを入力"
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  backgroundColor: theme.white,
                  border: manualAddressError ? `1px solid ${theme.alert}` : `1px solid ${theme.border}`,
                  flex: 1
                }}
              />
              <button
                onClick={handleAddManualAddress}
                style={{
                  padding: "8px 16px",
                  backgroundColor: theme.primary,
                  color: theme.white,
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                追加
              </button>
            </div>
            {manualAddressError && (
              <div style={{ color: theme.alert, fontSize: "12px", marginTop: "4px" }}>
                {manualAddressError}
              </div>
            )}
          </div>

          <div
            style={{
              backgroundColor: theme.white,
              padding: "12px",
              margin: 0,
              borderRadius: "8px"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedAddresses.length === (holders.length + manualAddresses.length)}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  disabled={isLoading}
                />
                <h2
                  style={{
                    margin: 0,
                    fontSize: "16px"
                  }}
                >
                  特典保有者一覧
                </h2>
              </div>
              <span
                style={{
                  fontSize: "14px",
                  color: theme.text.placeholder
                }}
              >
                {selectedAddresses.length}件選択中
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px"
              }}
            >
              {manualAddresses.map((address) => (
                <div
                  key={`manual-${address}`}
                  style={{
                    padding: "12px",
                    border: `1px solid ${theme.border}`,
                    borderRadius: "4px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    width: "250px",
                    flex: "1 1 250px",
                    backgroundColor: theme.background
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      maxWidth: "100%"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAddresses.includes(address)}
                      onChange={() => handleCheckboxChange(address)}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        maxWidth: "calc(100% - 24px)"
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          wordBreak: "break-all",
                          overflowWrap: "break-word"
                        }}
                      >
                        {address}
                      </span>
                      <span
                        style={{
                          color: theme.text.placeholder,
                          fontSize: "12px"
                        }}
                      >
                        手動追加
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading ? (
                <div
                  style={{
                    width: "100%",
                    textAlign: "center",
                    padding: "20px",
                    color: theme.text.placeholder
                  }}
                >
                  読み込み中...
                </div>
              ) : holders.length === 0 && manualAddresses.length === 0 ? (
                <div
                  style={{
                    width: "100%",
                    textAlign: "center",
                    padding: "20px",
                    color: theme.text.placeholder
                  }}
                >
                  特典保有者がいません
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
          {accountValidationError && (
            <div style={{ color: "red", marginBottom: "10px" }}>
              {accountValidationError}
            </div>
          )}
          <button
            onClick={handleSend}
            disabled={
              !!error ||
              !amount ||
              selectedAddresses.length === 0 ||
              selectedAddresses.length > 99 ||
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
                selectedAddresses.length > 99 ||
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
                selectedAddresses.length > 99 ||
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
              "配布する"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
