import { useTheme } from "../../components/ThemeContext"
import { useState } from "react"
import { defaultTheme } from "../../styles/theme/theme"

export const LimitedMemberPage: React.FC = () => {
  const { theme, updateTheme } = useTheme()
  // テーマプリセットを定義
  const themePresets = {
    default: {
      primary: defaultTheme.primary,
      secondary: defaultTheme.secondary,
      active: defaultTheme.text.active,
    },
    mustard: {
      primary: "#CDA74A",
      secondary: "#E2BD5D",
      active: "#715859",
    },
    pink: {
      primary: "#E99891",
      secondary: "#4D4D4D",
      active: "#EDD2D0",
    },
    red: {
      primary: "#DC2E29",
      secondary: "#D46B43",
      active: "#5E3C00",
    },
    purple: {
      primary: "#625A81",
      secondary: "#8E5568",
      active: "#D58B6D",
    },
    green: {
      primary: "#545b30",
      secondary: "#668068",
      active: "#DFDAC8",
    },
    brown: {
      primary: "#132439",
      secondary: "#BE842E",
      active: "#0F5154",
    },
  } as const

  // presetNameの型を定義
  type ThemePresetKey = keyof typeof themePresets
  const [selectedTheme, setSelectedTheme] = useState<ThemePresetKey>("default")

  // テーマ選択時の処理
  const handleThemeSelect = (presetName: ThemePresetKey) => {
    setSelectedTheme(presetName)

    if (presetName === "default") {
      updateTheme({
        ...defaultTheme,
      })
    } else {
      const preset = themePresets[presetName]
      updateTheme({
        ...theme,
        primary: preset.primary,
        secondary: preset.secondary,
        text: {
          ...theme.text,
          active: preset.active,
        },
      })
    }
  }

  // テーマを保存する処理
  const handleSaveTheme = () => {
    setSelectedTheme("default")
    updateTheme(defaultTheme)
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
