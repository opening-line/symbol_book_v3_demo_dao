import { createContext, useContext, useState, useEffect } from "react"
import { getActiveAddress, isAllowedSSS } from "sss-module"
import { ThemePresetKey, UserTheme, defaultTheme, themePresets } from "../styles/theme/theme"
import { Config } from "../utils/config"

type ThemeContextType = {
  theme: UserTheme
  updateTheme: (newThemeName: ThemePresetKey) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<UserTheme>(defaultTheme)

  useEffect(() => {
    // ユーザーの設定を取得
    const fetchUserTheme = async () => {
      try {
        const isSSSLinked = isAllowedSSS()
        const address = isSSSLinked ? getActiveAddress() : ""
        const response = await fetch(`${Config.API_HOST}/limited/theme`, {
          method: "GET",
          body: JSON.stringify({ address }),
        })
        const userThemeName = await response.json()

        const isValidTheme = (theme: ThemePresetKey) => {
          return theme in themePresets
        }
        setUserTheme(isValidTheme(userThemeName) ? userThemeName : 'default')
      } catch (error) {
        setTheme(defaultTheme)
      }
    }

    fetchUserTheme()
  }, [])

  const updateTheme = (newThemeName: ThemePresetKey) => {
    setUserTheme(newThemeName)
  }

  const setUserTheme = (userThemeName: ThemePresetKey) => {
    const userTheme = themePresets[userThemeName]
    setTheme({
      ...defaultTheme,
      primary: userTheme.primary,
      secondary: userTheme.secondary,
      text: {
        ...defaultTheme.text,
        active: userTheme.active,
      },
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
