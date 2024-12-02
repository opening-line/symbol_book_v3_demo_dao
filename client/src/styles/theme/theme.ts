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
