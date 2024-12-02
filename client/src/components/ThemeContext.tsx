import { createContext, useContext, useState, useEffect } from "react"
import { UserTheme, defaultTheme } from "../styles/theme/theme"

type ThemeContextType = {
  theme: UserTheme
  updateTheme: (newTheme: UserTheme) => Promise<void>
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
        const response = await fetch("/api/user/theme")
        const userTheme = await response.json()
        setTheme(userTheme)
      } catch (error) {
        console.error("テーマの取得に失敗しました:", error)
      }
    }
    fetchUserTheme()
  }, [])

  const updateTheme = async (newTheme: UserTheme) => {
    try {
      await fetch("/api/user/theme", {
        method: "PUT",
        body: JSON.stringify(newTheme),
      })
      setTheme(newTheme)
    } catch (error) {
      console.error("テーマの更新に失敗しました:", error)
    }
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
