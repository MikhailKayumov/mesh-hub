/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_APP_API_URL: string;
  VITE_APP_ENABLE_EDITOR: string;
  // test user
  VITE_APP_TEST_USER_EMAIL?: string;
  VITE_APP_TEST_USER_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
