/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_MOCK_USER_ID?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Local Mailpit/Inbucket mailbox URL, shown as a hint after sending a magic link. */
  readonly VITE_INBUCKET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
