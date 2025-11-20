import { DataSourceOptions } from 'typeorm';

type DatabaseType = DataSourceOptions['type'];

export interface AppConfig {
  google: {
    clientId?: string;
    clientSecret?: string;
    callbackUrl?: string;
  };
  database: {
    type: DatabaseType;
    url?: string;
    path?: string;
    synchronize: boolean;
  };
}

const configuration = (): AppConfig => {
  const dbType = (process.env.DATABASE_TYPE ?? 'sqlite') as DatabaseType;

  return {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ??
        'http://localhost:3000/auth/google/redirect',
    },
    database: {
      type: dbType,
      url: process.env.DATABASE_URL,
      path: process.env.DATABASE_PATH ?? 'vibe-habit-tracker.sqlite',
      synchronize: process.env.DATABASE_SYNCHRONIZE !== 'false',
    },
  };
};

export default configuration;
