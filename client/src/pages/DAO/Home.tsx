import { useEffect, useState } from "react"
import { getActiveAddress, getActiveName, isAllowedSSS } from "sss-module"
import { useTheme } from "../../components/ThemeContext"
import { Config } from "../../utils/config"

interface Mosaic {
  id: string
  name?: string
  amount: string
}

export const DAOHomePage: React.FC = () => {
  const { theme } = useTheme()
  const [username, setUsername] = useState<string>("")
  const [isSSSLinked, setIsSSSLinked] = useState<boolean>(false)
  const [mosaics, setMosaics] = useState<Mosaic[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const isSSSLinked = isAllowedSSS()
    const address = isSSSLinked ? getActiveAddress() : ""
    const name = isSSSLinked ? getActiveName() : "ゲスト"
    setIsSSSLinked(isSSSLinked)
    setUsername(name)
    if (!address) {
      setMosaics([])
      setLoading(false)
      return
    }

    const fetchMosaics = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `${Config.API_HOST}/home/mosaics/${address}`,
        )
        const data = await response.json()
        setMosaics(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchMosaics()
  }, [])

  return (
    <div>
      <h1>Welcome {username}!</h1>
      {isSSSLinked ? (
        <div>
          <ul
            style={{
              backgroundColor: theme.white,
              listStyle: "none",
              padding: 0,
              margin: 0,
              maxWidth: "500px",
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
                保有モザイク
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
            ) : !mosaics?.length ? (
              <li
                style={{
                  padding: "24px",
                  textAlign: "center",
                }}
              >
                <div>保有しているモザイクはありません</div>
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
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{mosaic.name || mosaic.id}</span>
                  <span>{mosaic.amount}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : (
        <div>
          <p>画面を右クリックしてSSS Extensionと連携してください。</p>
          <p>
            SSS Extensionをインストールしていない場合は
            <a
              href='https://chromewebstore.google.com/detail/sss-extension/llildiojemakefgnhhkmiiffonembcan'
              target='_blank'
              rel='noopener noreferrer'
            >
              こちら
            </a>
          </p>
          <p>
            SSS Extensionの設定方法は
            <a
              href='https://docs.sss-symbol.com/ja/UsersGuide/AccountSetting'
              target='_blank'
              rel='noopener noreferrer'
            >
              こちら
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
