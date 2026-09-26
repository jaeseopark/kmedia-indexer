export { };

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      NODE_ENV?: 'development' | 'production' | 'test';
      INGEST_API_KEY?: string;
      DB_PATH?: string;
      CORS_ORIGIN?: string;
    }
  }
}
