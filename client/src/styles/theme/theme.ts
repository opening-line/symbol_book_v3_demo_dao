export type UserTheme = {
  primary: string
  secondary: string
  background: string
  border: string
  disabled: string
  alert: string
  text: {
    active: string
    button: string
    placeholder: string
  }
  black: string
  white: string
  transparent: string
}

export const defaultTheme: UserTheme = {
  primary: "#0C1228",
  secondary: "#181F39",
  background: "#F0F0F0",
  border: "#E0E0E0",
  disabled: "#CCCCCC",
  alert: "#FF3333",
  text: {
    active: "#F88D4B",
    button: "#FFFFFF",
    placeholder: "#666666",
  },
  black: "#000000",
  white: "#FFFFFF",
  transparent: "transparent",
}

export const themePresets = {
  default: {
    primary: defaultTheme.primary,
    secondary: defaultTheme.secondary,
    active: defaultTheme.text.active,
  },
  mustard: {
    primary: "#CDA74A",
    secondary: "#E2BD5D",
    active: "#715859",
  },
  pink: {
    primary: "#E99891",
    secondary: "#4D4D4D",
    active: "#EDD2D0",
  },
  red: {
    primary: "#DC2E29",
    secondary: "#D46B43",
    active: "#5E3C00",
  },
  purple: {
    primary: "#625A81",
    secondary: "#8E5568",
    active: "#D58B6D",
  },
  green: {
    primary: "#545b30",
    secondary: "#668068",
    active: "#DFDAC8",
  },
  brown: {
    primary: "#132439",
    secondary: "#BE842E",
    active: "#0F5154",
  },
}

export type ThemePresetKey = keyof typeof themePresets