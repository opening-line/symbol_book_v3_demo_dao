import React, { useState, ReactElement, useEffect } from "react"
import SideMenu from "./SideMenu"
import Header from "./Header"
import { getActiveAddress, getActiveName, isAllowedSSS } from "sss-module"
import { CreateDAOPage } from "../pages/DAO/Create"

interface LayoutProps {
  children: ReactElement<any>
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(true)
  const [address, setAddress] = useState<string>("")
  const [name, setName] = useState<string>("")
  const [isSSSLinked, setIsSSSLinked] = useState<boolean>(false)
  const [id, setId] = useState<string>("")

  useEffect(() => {
    // TODO: DAO IDを取得する方法を検討
    const id =
      "4627107BAD5B345883ABC6551CEA3C7C7283C8B354E758F180AE91DFA0227CD7"
    setId(id)
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
          {id ? (
            React.cloneElement(children as any, { username: name })
          ) : (
            <CreateDAOPage />
          )}
        </main>
      </div>
    </div>
  )
}

export default Layout
