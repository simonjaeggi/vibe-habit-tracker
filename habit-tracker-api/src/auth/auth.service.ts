import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { GoogleProfilePayload } from '../users/entities/user.entity';
import {
  AuthenticatedUser,
  OAuthTokens,
} from './interfaces/authenticated-user.interface';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async handleGoogleLogin(
    profile: GoogleProfilePayload,
    tokens: OAuthTokens,
  ): Promise<AuthenticatedUser> {
    const user = await this.usersService.upsertGoogleUser(profile);
    return {
      user,
      tokens,
    };
  }

  buildLoginResponse(authenticated: AuthenticatedUser) {
    return {
      user: authenticated.user,
      tokens: authenticated.tokens,
    };
  }
}
