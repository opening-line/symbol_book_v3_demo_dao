import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTheme } from "../../components/ThemeContext" // Assuming a theme hook is available

export const HomePage: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [daoId, setDaoId] = useState<string>("")

  const handleCreateDAONavigate = () => {
    navigate("/dao/create")
  }

  const handleDAODetailsNavigate = () => {
    if (daoId) {
      navigate(`/dao/${daoId}`)
    } else {
      alert("Please enter a valid DAO ID.")
    }
  }

  return (
    <div style={{ padding: "20px", backgroundColor: theme.background }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "400px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={handleCreateDAONavigate}
          style={{
            padding: "10px 20px",
            backgroundColor: theme.primary,
            color: theme.white,
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Create DAO
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type='text'
            value={daoId}
            onChange={(e) => setDaoId(e.target.value)}
            placeholder='Enter DAO ID'
            style={{
              padding: "10px",
              borderRadius: "4px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.white,
            }}
          />
          <button
            onClick={handleDAODetailsNavigate}
            style={{
              padding: "10px 20px",
              backgroundColor: theme.secondary,
              color: theme.white,
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            View DAO Details
          </button>
        </div>
      </div>
    </div>
  )
}