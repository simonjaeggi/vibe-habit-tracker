import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { GoogleProfilePayload, User } from '../users/entities/user.entity';
import {
  AuthenticatedUser,
  OAuthTokens,
} from './interfaces/authenticated-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

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

  signUser(user: User) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
  }

  buildLoginResponse(authenticated: AuthenticatedUser) {
    const jwt = this.signUser(authenticated.user);
    return {
      user: authenticated.user,
      tokens: authenticated.tokens,
      jwt,
    };
  }
}
