import { Link, useLocation } from "react-router-dom"
import { BiCoinStack } from "react-icons/bi"
import {
  MdOutlineCardGiftcard,
  MdOutlineHowToVote,
  MdOutlineLock,
  MdOutlineSettings,
  MdOutlineHome,
} from "react-icons/md"
import { useEffect, useState } from "react"

interface SideMenuProps {
  address: string
  isOpen: boolean
  isSSSLinked: boolean
}

const SideMenu: React.FC<SideMenuProps> = ({
  address,
  isOpen,
  isSSSLinked,
}) => {
  const location = useLocation()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isManagerAccount, setIsManagerAccount] = useState<boolean>(false)
  const [hasLimitedMosaic, setHasLimitedMosaic] = useState<boolean>(false)
  useEffect(() => {
    ;(async () => {
      // 自分がDAO管理者であるかどうかを確認
      const daoInfo = {
        address: address,
        metadata: [],
        cosignatory: [],
      } // TODO: DAOデータ取得APIに変更
      const isManagerAccount = daoInfo?.address === address
      setIsManagerAccount(isManagerAccount)

      // 特別会員限定モザイクを保有しているかどうかを確認
      const hasLimitedMosaic = true // TODO: 保有モザイク取得APIに変更
      setHasLimitedMosaic(hasLimitedMosaic)
    })()
  }, [])

  // TODO: そもそもDAOが存在するかどうかをどう判定するか
  const menuItems = [
    { text: "ホーム", path: "/", icon: <MdOutlineHome />, requiresSSS: false },
    {
      text: "ガバナンス投票",
      path: "/governance",
      icon: <MdOutlineHowToVote />,
      requiresSSS: true,
    },
    {
      text: "特別会員限定",
      path: "/limited",
      icon: <MdOutlineLock />,
      requiresSSS: true,
    },
    ...(isManagerAccount
      ? [
          {
            text: "DAO設定",
            path: "/dao",
            icon: <MdOutlineSettings />,
            requiresSSS: true,
          },
          {
            text: "特典管理",
            path: "/reward",
            icon: <MdOutlineCardGiftcard />,
            requiresSSS: true,
          },
          {
            text: "ポイント管理",
            path: "/point",
            icon: <BiCoinStack />,
            requiresSSS: true,
          },
        ]
      : []),
  ]

  const sideMenuStyle = {
    width: isOpen ? "200px" : "60px",
    borderRight: "1px solid #e0e0e0",
    padding: "10px",
    backgroundColor: "#181F39",
    height: "calc(100vh - 60px)",
    position: "fixed" as const,
    top: "60px",
    left: "0",
    transition: "width 0.3s ease",
    zIndex: 1000,
  }

  const menuListStyle = {
    listStyle: "none" as const,
    padding: 0,
    margin: 0,
    width: "100%",
  }

  const menuItemStyle = {
    margin: 0,
    padding: 0,
    marginBottom: "10px",
  }

  const menuLinkStyle = (
    isActive: boolean,
    isHovered: boolean,
    isDisabled: boolean,
  ) => ({
    textDecoration: "none" as const,
    color: isDisabled ? "#666666" : isActive ? "#F88D4B" : "#FFFFFF",
    display: "flex",
    alignItems: "center",
    padding: "8px",
    gap: "8px",
    justifyContent: isOpen ? "flex-start" : "center",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    transition: "background-color 0.2s",
    backgroundColor: isHovered && !isDisabled ? "#2A3352" : "transparent",
    height: "40px",
    lineHeight: "24px",
    pointerEvents: isDisabled ? ("none" as const) : ("auto" as const),
    opacity: isDisabled ? 0.5 : 1,
  })

  const iconStyle = {
    fontSize: "24px",
    minWidth: "24px",
    textAlign: "center" as const,
  }

  const textStyle = {
    opacity: isOpen ? 1 : 0,
    transition: "opacity 0.2s ease",
  }

  return (
    <div style={sideMenuStyle}>
      <ul style={menuListStyle}>
        {menuItems.map((item) => {
          const isDisabled =
            (!isSSSLinked && item.requiresSSS) ||
            (item.path === "/limited" && !hasLimitedMosaic && !isManagerAccount)

          return (
            <li key={item.text} style={menuItemStyle}>
              <Link
                to={item.path}
                style={menuLinkStyle(
                  location.pathname === item.path,
                  hoveredItem === item.text,
                  isDisabled,
                )}
                onMouseEnter={() => setHoveredItem(item.text)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <span style={iconStyle}>{item.icon}</span>
                {isOpen && <span style={textStyle}>{item.text}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default SideMenu
