import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { GoogleProfilePayload, User } from '../users/entities/user.entity';
import {
  AuthenticatedUser,
  OAuthTokens,
} from './interfaces/authenticated-user.interface';
import * as bcrypt from 'bcryptjs';
import { RegisterLocalDto } from './dto/register-local.dto';
import { LoginLocalDto } from './dto/login-local.dto';

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

  async registerLocal(payload: RegisterLocalDto): Promise<AuthenticatedUser> {
    const existing = await this.usersService.findByEmail(payload.email);

    if (existing) {
      throw new ConflictException('A user with that email already exists');
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const user = await this.usersService.createLocalUser(
      payload.email,
      payload.displayName,
      passwordHash,
    );

    return { user };
  }

  async loginLocal(payload: LoginLocalDto): Promise<AuthenticatedUser> {
    const user = await this.usersService.findByEmail(payload.email);

    if (!user || user.provider !== 'local' || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { user };
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
