/// <reference types="vite/client" />

declare module '*.scss' {
  const classes: Record<string, string>
  export default classes
}

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string
  readonly VITE_GITHUB_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
