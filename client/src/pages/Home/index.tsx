import { useEffect, useState } from "react"
import { Config } from "../../utils/config"
import { getActiveAddress, getActiveName, isAllowedSSS } from "sss-module"

interface Mosaic {
  id: string
  amount: string
}

export const HomePage: React.FC = () => {
  const [username, setUsername] = useState<string>("")
  // TODO: SSSと連携しているかどうかの判定がLayout.tsxと二重管理になってしまっている問題を解消する
  const [isSSSLinked, setIsSSSLinked] = useState<boolean>(false)
  const [mosaics, setMosaics] = useState<Mosaic[]>([])

  useEffect(() => {
    // デバッグ用
    // const isSSSLinked = false;

    const isSSSLinked = isAllowedSSS()
    const address = isSSSLinked ? getActiveAddress() : ""
    const name = isSSSLinked ? getActiveName() : "ゲスト"
    setIsSSSLinked(isSSSLinked)
    setUsername(name)

    if (!address) {
      setMosaics([])
      return
    }

    ;(async () => {
      // アドレスを基に保有モザイク一覧を取得
      const response = await fetch(`${Config.API_HOST}/home/mosaics/${address}`)
      const data = await response.json()
      console.log("mosaics", data)
      setMosaics(data)
    })()
  }, [])

  return (
    <div>
      <h1>Welcome {username}!</h1>
      {isSSSLinked ? (
        <div>
          <ul
            style={{
              backgroundColor: "#FFFFFF",
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
            {mosaics.map((mosaic, index) => (
              <li
                key={mosaic.id}
                style={{
                  padding: "12px",
                  borderBottom:
                    index === mosaics.length - 1 ? "none" : "1px solid #E0E0E0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{mosaic.id}</span>
                <span>{mosaic.amount}</span>
              </li>
            ))}
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
