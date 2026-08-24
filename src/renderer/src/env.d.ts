/// <reference types="vite/client" />

import type { BionApi } from '../../preload/index'

declare global {
  interface Window {
    api: BionApi
  }
}

export {}
