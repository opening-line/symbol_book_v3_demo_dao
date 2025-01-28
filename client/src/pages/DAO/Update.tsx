import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { Config } from "../../utils/config"
import { useTheme } from "../../components/ThemeContext"

export const UpdateDAOPage: React.FC = () => {
  const {theme} = useTheme()
  const [admins, setAdmins] = useState<string[]>([])
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([])

  const { id } = useParams()

  const [newAdmin, setNewAdmin] = useState<string>("")

  const handleRemoveSelectedAdmins = () => {
    console.log({ selectedAdmins })
    fetch(`${Config.API_HOST}/admin/delete`, {
      method: "PUT",
      body: JSON.stringify({
        daoId: id,
        addresses: selectedAdmins,
      }),
    })
  }
  const handleAddAdmin = () => {
    fetch(`${Config.API_HOST}/admin/add`, {
      method: "PUT",
      body: JSON.stringify({
        daoId: id,
        addresses: [newAdmin],
      }),
    })
  }

  const handleSelectAdmin = (admin: string) => {
    if (selectedAdmins.includes(admin)) {
      setSelectedAdmins(selectedAdmins.filter((a) => a !== admin))
    } else {
      setSelectedAdmins([...selectedAdmins, admin])
    }
  }

  useEffect(() => {
    fetch(`${Config.API_HOST}/admin/get/${id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data)
        setAdmins(data.cosignatory)
      })
  }, [])

  return (
    <div style={{ padding: "20px", backgroundColor: theme.background }}>
      <h1 style={{ color: theme.primary }}>Update DAO Page</h1>
      <div>
        <h2 style={{ color: theme.secondary }}>Current Admins</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  border: `1px solid ${theme.border}`,
                  padding: "8px",
                  textAlign: "left",
                  width: "100px",
                }}
              >
                Select
              </th>
              <th
                style={{
                  border: `1px solid ${theme.border}`,
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Admin Address
              </th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin}>
                <td
                  style={{
                    border: `1px solid ${theme.border}`,
                    padding: "8px",
                    textAlign: "left",
                  }}
                >
                  <input
                    type='checkbox'
                    checked={selectedAdmins.includes(admin)}
                    onChange={() => handleSelectAdmin(admin)}
                  />
                </td>
                <td style={{ border: `1px solid ${theme.border}`, padding: "8px" }}>
                  {admin}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={handleRemoveSelectedAdmins}
          style={{
            marginTop: "10px",
            padding: "10px 20px",
            backgroundColor: theme.alert,
            color: theme.white,
            border: "none",
            cursor: "pointer",
          }}
          disabled={selectedAdmins.length === 0}
        >
          Remove Selected Admins
        </button>
        <h2 style={{ color: theme.secondary }}>Add New Admin</h2>
        <input
          type='text'
          value={newAdmin}
          onChange={(e) => setNewAdmin(e.target.value)}
          placeholder='Enter admin address'
          style={{
            padding: "10px",
            width: "calc(100% - 22px)",
            marginBottom: "10px",
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.white,
          }}
        />
        <button
          onClick={handleAddAdmin}
          style={{
            padding: "10px 20px",
            backgroundColor: theme.primary,
            color: theme.white,
            border: "none",
            cursor: "pointer",
          }}
        >
          Add Admin
        </button>
      </div>
    </div>
  )
}
