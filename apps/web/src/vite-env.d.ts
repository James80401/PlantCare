/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ENABLE_PREMIUM_BILLING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
