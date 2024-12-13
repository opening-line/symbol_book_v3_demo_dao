import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { Config } from "../../utils/config"

export const UpdateDAOPage: React.FC = () => {
  const [admins, setAdmins] = useState<string[]>([])
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([])

  const { id } = useParams()

  const [newAdmin, setNewAdmin] = useState("")

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
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Update DAO Page</h1>
      <div>
        <h2>Current Admins</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                  width: "100px",
                }}
              >
                Select
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
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
                    border: "1px solid #ddd",
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
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
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
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
          disabled={selectedAdmins.length === 0}
        >
          Remove Selected Admins
        </button>
        <h2>Add New Admin</h2>
        <input
          type='text'
          value={newAdmin}
          onChange={(e) => setNewAdmin(e.target.value)}
          placeholder='Enter admin address'
          style={{
            padding: "10px",
            width: "calc(100% - 22px)",
            marginBottom: "10px",
            border: "1px solid #ddd",
          }}
        />
        <button
          onClick={handleAddAdmin}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
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
