/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEEPSEEK_API_KEY: string
  readonly VITE_DEEPSEEK_BASE_URL: string
  readonly VITE_DOUBAO_API_KEY: string
  readonly VITE_DOUBAO_ENDPOINT_ID: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_OSS_BUCKET?: string
  readonly VITE_OSS_REGION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
