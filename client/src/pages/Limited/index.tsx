import { useState } from "react"
import {
  getActivePublicKey,
  requestSignCosignatureTransaction,
  setTransactionByPayload,
} from "sss-module"
import { utils } from "symbol-sdk"
import { models } from "symbol-sdk/symbol"
import { useTheme } from "../../components/ThemeContext"
import { themePresets } from "../../styles/theme/theme"
import { Config } from "../../utils/config"

export const LimitedMemberPage: React.FC = () => {
  const { theme, updateTheme } = useTheme()

  // presetNameの型を定義
  type ThemePresetKey = keyof typeof themePresets
  const [selectedTheme, setSelectedTheme] = useState<ThemePresetKey>("default")

  // テーマ選択時の処理
  const handleThemeSelect = (presetName: ThemePresetKey) => {
    setSelectedTheme(presetName)
    updateTheme(presetName)
  }

  // テーマを保存する処理
  const handleSaveTheme = async () => {
    const { payload } = await fetch(`${Config.API_HOST}/limited/theme/update`, {
      method: "PUT",
      body: JSON.stringify({
        publicKey: getActivePublicKey(),
        themeName: selectedTheme,
      }),
    }).then((res) => res.json())

    const tx = models.AggregateCompleteTransactionV3.deserialize(
      utils.hexToUint8(payload),
    )
    setTransactionByPayload(payload)

    const cosignedTx = await requestSignCosignatureTransaction()

    const cosignature = new models.Cosignature()
    cosignature.signature.bytes = utils.hexToUint8(cosignedTx.signature)
    cosignature.signerPublicKey.bytes = utils.hexToUint8(
      cosignedTx.signerPublicKey,
    )
    tx.cosignatures.push(cosignature)

    const jsonPayload2 = `{"payload":"${utils.uint8ToHex(tx.serialize())}"}`

    await fetch(new URL("/transactions", Config.NODE_URL), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: jsonPayload2,
    })
  }

  return (
    <div style={{ backgroundColor: theme.background }}>
      <h1 style={{ color: theme.primary }}>特別会員限定メニュー</h1>
      <p style={{ color: theme.black }}>
        このページは特別会員のみがアクセスできます。
      </p>
      <p style={{ color: theme.black }}>
        ここではサンプルとしてテーマカラー変更機能を実装しています。
      </p>
      <div>
        <h2>テーマカラーを選択</h2>
        {Object.entries(themePresets).map(([presetName, colors]) => (
          <div
            key={presetName}
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <input
              type='radio'
              id={presetName}
              name='theme'
              value={presetName}
              checked={selectedTheme === presetName}
              onChange={(e) =>
                handleThemeSelect(e.target.value as ThemePresetKey)
              }
            />
            <label htmlFor={presetName} style={{ minWidth: "100px" }}>
              {presetName}
            </label>
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: colors.primary,
              }}
            />
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: colors.secondary,
              }}
            />
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: colors.active,
              }}
            />
          </div>
        ))}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleSaveTheme}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: theme.secondary,
              color: theme.background,
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            テーマを保存する
          </button>
        </div>
      </div>
    </div>
  )
}
