import React, { useState, useEffect } from "react"
import SideMenu from "./SideMenu"
import Header from "./Header"
import { getActiveAddress, getActiveName, isAllowedSSS } from "sss-module"
import { CreateDAOPage } from "../pages/DAO/Create"
import { Outlet, useParams } from "react-router"

const Layout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(true)
  const [address, setAddress] = useState<string>("")
  const [name, setName] = useState<string>("")
  const [isSSSLinked, setIsSSSLinked] = useState<boolean>(false)
  const { id } = useParams()

  useEffect(() => {
    const isSSSLinked = isAllowedSSS()
    const address = isSSSLinked ? getActiveAddress() : ""
    const name = isSSSLinked ? getActiveName() : "ゲスト"
    setIsSSSLinked(isSSSLinked)
    setAddress(address)
    setName(name)
  }, [])

  const layoutStyle = {
    display: "flex",
    flexDirection: "column" as "column",
    minHeight: "100vh",
    margin: 0,
    padding: 0,
  }

  const contentWrapperStyle = {
    display: "flex",
    flexGrow: 1,
    position: "relative" as "relative",
    margin: 0,
    padding: 0,
    marginTop: "60px",
  }

  const mainContentStyle = {
    flexGrow: 1,
    marginLeft: isMenuOpen ? "200px" : "60px",
    transition: "margin-left 0.3s ease",
    paddingLeft: "20px",
  }

  if (!id) {
    // TODO: 見た目変えただけでURLは変わってないので、URLを変える
    return <CreateDAOPage />
  }

  return (
    <div style={layoutStyle}>
      <Header
        userId={address}
        userName={name}
        onMenuClick={() => setIsMenuOpen(!isMenuOpen)}
      />
      <div style={contentWrapperStyle}>
        <SideMenu
          id={id}
          sssAddress={address}
          isOpen={isMenuOpen}
          isSSSLinked={isSSSLinked}
        />
        <main style={mainContentStyle}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
