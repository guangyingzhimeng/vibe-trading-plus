/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_AUTH_KEY?: string;
  readonly VITE_BROWSER_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
