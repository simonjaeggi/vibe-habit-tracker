import { User } from '../../users/entities/user.entity';

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthenticatedUser {
  user: User;
  tokens?: OAuthTokens;
}
