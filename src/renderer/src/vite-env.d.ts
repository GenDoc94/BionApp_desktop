/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BIONAPP_MODE?: string
  readonly VITE_BIONAPP_UPDATE_REPO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
