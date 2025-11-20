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
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
    jwtExpiresInMs: number;
    frontendAppUrl?: string;
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
    auth: {
      jwtSecret:
        process.env.JWT_SECRET ??
        'development-secret-change-me-before-production',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
      jwtExpiresInMs: parseExpiresToMs(process.env.JWT_EXPIRES_IN ?? '7d'),
      frontendAppUrl:
        process.env.FRONTEND_APP_URL ?? 'http://localhost:5173/auth/callback',
    },
  };
};

function parseExpiresToMs(value: string): number {
  const match = value.trim().match(/^(\d+)([smhd])$/i);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'd':
    default:
      return amount * 24 * 60 * 60 * 1000;
  }
}

export default configuration;
