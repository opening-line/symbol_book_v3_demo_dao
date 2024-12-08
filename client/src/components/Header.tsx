import { HiMenu } from "react-icons/hi"
import { useTheme } from "./ThemeContext"

interface HeaderProps {
  userId: string
  userName: string
  onMenuClick: () => void
}

const Header: React.FC<HeaderProps> = ({
  userId = "",
  userName = "ゲスト",
  onMenuClick,
}) => {
  const { theme } = useTheme()

  return (
    <header
      style={{
        height: "60px",
        backgroundColor: theme.primary,
        color: theme.white,
        padding: "0 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        margin: 0,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1001,
      }}
    >
      <button
        onClick={onMenuClick}
        style={{
          background: "none",
          border: "none",
          color: theme.white,
          cursor: "pointer",
          padding: "8px 8px 8px 0px",
          margin: 0,
        }}
      >
        <HiMenu size={24} />
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          margin: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "2px",
          }}
        >
          <span style={{ fontSize: "14px" }}>{userName}</span>
          <span style={{ fontSize: "12px", opacity: 0.7 }}>{userId}</span>
        </div>
      </div>
    </header>
  )
}

export default Header
