/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BROWSER_API_URL?: string;
  readonly VITE_BROWSER_API_PREFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
