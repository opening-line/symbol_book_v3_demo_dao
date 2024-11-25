import React, { useState, ReactElement, useEffect } from "react"
import SideMenu from "./SideMenu"
import Header from "./Header"
import { getActiveAddress, getActiveName, isAllowedSSS } from "sss-module"

interface LayoutProps {
  children: ReactElement<any>
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(true)
  const [address, setAddress] = useState<string>("")
  const [name, setName] = useState<string>("")
  const [isSSSLinked, setIsSSSLinked] = useState<boolean>(false)

  useEffect(() => {
    // デバッグ用
    // const isSSSLinked = false;

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
          address={address}
          isOpen={isMenuOpen}
          isSSSLinked={isSSSLinked}
        />
        <main style={mainContentStyle}>
          {React.cloneElement(children as any, { username: name })}
        </main>
      </div>
    </div>
  )
}

export default Layout
