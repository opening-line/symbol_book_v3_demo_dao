import { useEffect, useState } from "react"
import { useParams } from "react-router";
import { Config } from "../../utils/config";


export const UpdateDAOPage: React.FC = () => {
  const [admins, setAdmins] = useState<string[]>([])
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([])

  const { id } = useParams()

  const [newAdmin, setNewAdmin] = useState("")

  const handleRemoveSelectedAdmins = () => {
    console.log({ selectedAdmins })
    fetch(`${Config.API_HOST}/admin/delete`, {
      method: "POST",
      body: JSON.stringify({
        daoId: id,
        addresses: selectedAdmins,
      }),
    })
  }
  const handleAddAdmin = () => {
    fetch(`${Config.API_HOST}/admin/add`, {
      method: "POST",
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
    <div>
      <h1>UPDATE DAO PAGE</h1>
      <div>
        <h2>Current Admins</h2>
        <ul>
          {admins.map((admin) => (
            <li key={admin}>
              <input
                type='checkbox'
                checked={selectedAdmins.includes(admin)}
                onChange={() => handleSelectAdmin(admin)}
              />
              {admin}
            </li>
          ))}
        </ul>
        <button onClick={handleRemoveSelectedAdmins}>
          Remove Selected Admins
        </button>
        <h2>Add New Admin</h2>
        <input
          type='text'
          value={newAdmin}
          onChange={(e) => setNewAdmin(e.target.value)}
          placeholder='Enter admin address'
        />
        <button onClick={handleAddAdmin}>Add Admin</button>
      </div>
    </div>
  )
}
