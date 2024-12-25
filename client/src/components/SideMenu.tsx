import { useEffect, useState } from "react"
import { BiCoinStack } from "react-icons/bi"
import {
  MdOutlineCardGiftcard,
  MdOutlineHowToVote,
  MdOutlineLock,
  MdOutlineSettings,
  MdOutlineHome,
} from "react-icons/md"
import { Link, useLocation } from "react-router-dom"
import { Config } from "../utils/config"
import { useTheme } from "./ThemeContext"

interface DaoInfo {
  address: string
  metadata: any[]
  cosignatory: any[]
}

interface Mosaic {
  id: string
  amount: string
}

interface SideMenuProps {
  id: string
  sssAddress: string
  isOpen: boolean
  isSSSLinked: boolean
}

const SideMenu: React.FC<SideMenuProps> = ({
  id,
  sssAddress,
  isOpen,
  isSSSLinked,
}) => {
  const location = useLocation()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isManagerAccount, setIsManagerAccount] = useState<boolean>(false)
  const [hasLimitedMosaic, setHasLimitedMosaic] = useState<boolean>(false)
  const { theme } = useTheme()

  useEffect(() => {
    const checkUserPermissions = async () => {
      if (!id) return

      try {
        // 自分がDAO管理者であるかどうかを確認
        const daoInfo: DaoInfo = await fetch(
          `${Config.API_HOST}/admin/get/${id}`,
        ).then((res) => res.json())
        const isManagerAccount = daoInfo?.cosignatory?.includes(sssAddress)
        console.log("isManagerAccount", isManagerAccount)
        setIsManagerAccount(isManagerAccount)

        // 特別会員限定モザイクを保有しているかどうかを確認
        const mosaics = await fetch(
          `${Config.API_HOST}/home/mosaics/${sssAddress}`,
        ).then((res) => res.json())

        const daoRewardMosaics = await fetch(
          `${Config.API_HOST}/admin/reward/${id}`,
        ).then((res) => res.json())

        console.log(daoRewardMosaics)

        const hasLimitedMosaic = mosaics.some((mosaic: Mosaic) =>
          daoRewardMosaics.map((m: { id: string }) => m.id).includes(mosaic.id),
        )
        setHasLimitedMosaic(hasLimitedMosaic)
      } catch (error) {
        console.error("権限チェック中にエラーが発生しました:", error)
        setIsManagerAccount(false)
        setHasLimitedMosaic(false)
      }
    }

    checkUserPermissions()
  }, [sssAddress])

  const menuItems = id
    ? [
        {
          text: "ホーム",
          path: `/dao/${id}`,
          icon: <MdOutlineHome />,
          requiresSSS: false,
        },
        {
          text: "ガバナンス投票",
          path: `/dao/${id}/governance`,
          icon: <MdOutlineHowToVote />,
          requiresSSS: true,
        },
        {
          text: "特別会員限定",
          path: `/dao/${id}/limited`,
          icon: <MdOutlineLock />,
          requiresSSS: true,
          requiresPermission: true,
        },
        ...(isManagerAccount
          ? [
              {
                text: "DAO設定",
                path: `/dao/${id}/update`,
                icon: <MdOutlineSettings />,
                requiresSSS: true,
              },
              {
                text: "特典管理",
                path: `/dao/${id}/reward`,
                icon: <MdOutlineCardGiftcard />,
                requiresSSS: true,
              },
              {
                text: "ポイント管理",
                path: `/dao/${id}/point`,
                icon: <BiCoinStack />,
                requiresSSS: true,
              },
            ]
          : []),
      ]
    : []

  const sideMenuStyle = {
    width: isOpen ? "200px" : "60px",
    padding: "10px",
    backgroundColor: theme.secondary,
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
    color: isDisabled
      ? theme.text.placeholder
      : isActive
        ? theme.text.active
        : theme.white,
    display: "flex",
    alignItems: "center",
    padding: "8px",
    gap: "8px",
    justifyContent: isOpen ? "flex-start" : "center",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    transition: "background-color 0.2s",
    backgroundColor: isHovered && !isDisabled ? theme.primary : "transparent",
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
            (item.requiresPermission && !hasLimitedMosaic && !isManagerAccount)

          return (
            <li key={item.text} style={menuItemStyle}>
              <Link
                to={item.path}
                style={menuLinkStyle(
                  location.pathname === item.path,
                  hoveredItem === item.text,
                  isDisabled ?? false,
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
