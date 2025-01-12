import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { useTheme } from "../../components/ThemeContext"
import { Config } from "../../utils/config"

interface Mosaic {
  id: string
  maxSupply: number
  balance: number
  name?: string
}

export const ExchangeItemCreatePage: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [description, setDescription] = useState<string>("")
  const [exchangeCost, setExchangeCost] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const isDisabled = !description || !exchangeCost
  const [rewardMosaics, setRewardMosaics] = useState<Mosaic[]>([])
  const [pointMosaics, setPointMosaics] = useState<Mosaic[]>([])
  const [isLoadingRewardMosaics, setIsLoadingRewardMosaics] =
    useState<boolean>(true)
  const [isLoadingPointMosaics, setIsLoadingPointMosaics] =
    useState<boolean>(true)
  const [selectedRewardMosaicId, setSelectedRewardMosaicId] =
    useState<string>("")
  const [selectedPointMosaicId, setSelectedPointMosaicId] = useState<string>("")
  const [selectedPointMosaicName, setSelectedPointMosaicName] =
    useState<string>("")

  useEffect(() => {
    // DAOが発行している特典モザイクを取得
    const fetchRewardMosaics = async () => {
      try {
        setIsLoadingRewardMosaics(true)
        const response = await fetch(`${Config.API_HOST}/admin/reward/${id}`)
        const mosaics = await response.json()
        setRewardMosaics(mosaics)
      } catch (error) {
        console.error(error)
        alert("特典モザイクが見つかりませんでした。")
      } finally {
        setIsLoadingRewardMosaics(false)
      }
    }

    // DAOが発行しているポイントモザイクを取得
    const fetchPointMosaics = async () => {
      try {
        setIsLoadingPointMosaics(true)
        const response = await fetch(`${Config.API_HOST}/admin/point/${id}`)
        const mosaics = await response.json()
        setPointMosaics(mosaics)
      } catch (error) {
        console.error(error)
        alert("ポイントモザイクが見つかりませんでした。")
      } finally {
        setIsLoadingPointMosaics(false)
      }
    }

    fetchPointMosaics()
    fetchRewardMosaics()
  }, [id])

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDescription(e.target.value)
  }

  const handleExchangeCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (value <= 8999999999) {
      setExchangeCost(e.target.value)
    }
  }

  const handleSelectedPointMosaicChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const mosaic = pointMosaics.find((mosaic) => mosaic.id === e.target.value)
    if (mosaic) {
      setSelectedPointMosaicId(mosaic.id)
      setSelectedPointMosaicName(mosaic.name || "")
    }
  }

  const handleCreate = () => {
    setIsSubmitting(true)
    fetch(`${Config.API_HOST}/admin/exchange/createItem`, {
      method: "POST",
      body: JSON.stringify({
        daoId: id,
        description,
        rewardMosaicId: selectedRewardMosaicId,
        pointMosaicId: selectedPointMosaicId,
        pointMosaicName: selectedPointMosaicName,
        exchangeCost,
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
        <h1>交換アイテム作成</h1>

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
            <label>交換アイテムとなる特典モザイク：</label>
            {isLoadingRewardMosaics ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div className='loader' />
                <span style={{ color: theme.disabled }}>読み込み中...</span>
              </div>
            ) : (
              <select
                value={selectedRewardMosaicId}
                onChange={(e) => setSelectedRewardMosaicId(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  backgroundColor: theme.white,
                  border: "none",
                  width: "200px",
                }}
              >
                <option value=''>選択してください</option>
                {rewardMosaics.map((mosaic) => (
                  <option key={mosaic.id} value={mosaic.id}>
                    {mosaic.name || mosaic.id} (残高: {mosaic.balance})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div
            style={{
              marginBottom: "20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <label>交換アイテム詳細：</label>
            <textarea
              value={description}
              onChange={handleDescriptionChange}
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
              placeholder='交換アイテム詳細を入力'
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              height: "36px",
            }}
          >
            <label>交換に使用するポイントモザイク：</label>
            {isLoadingPointMosaics ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div className='loader' />
                <span style={{ color: theme.disabled }}>読み込み中...</span>
              </div>
            ) : (
              <select
                value={selectedPointMosaicId}
                onChange={handleSelectedPointMosaicChange}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  backgroundColor: theme.white,
                  border: "none",
                  width: "200px",
                }}
              >
                <option value=''>選択してください</option>
                {pointMosaics.map((mosaic) => (
                  <option key={mosaic.id} value={mosaic.id}>
                    {mosaic.name || mosaic.id} (残高: {mosaic.balance})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              height: "36px",
            }}
          >
            <label>交換に必要なポイント数：</label>
            <div
              style={{
                display: "flex",
                gap: "8px",
                height: "100%",
              }}
            >
              <input
                type='number'
                value={exchangeCost}
                onChange={handleExchangeCostChange}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  backgroundColor: theme.white,
                  border: "none",
                  width: "200px",
                }}
                placeholder='交換に必要なポイント数を入力'
                min='0'
                max='8999999999'
              />
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
              "登録する"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
