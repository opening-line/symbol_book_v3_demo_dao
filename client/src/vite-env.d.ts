/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_PRIVATE_KEY: string
  // その他の環境変数...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
