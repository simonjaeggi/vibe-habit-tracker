import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import type { RequestWithUser } from './interfaces/request-with-user.interface';
import { RegisterLocalDto } from './dto/register-local.dto';
import { LoginLocalDto } from './dto/login-local.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async registerLocal(@Body() payload: RegisterLocalDto) {
    const authenticated = await this.authService.registerLocal(payload);
    return this.authService.buildLoginResponse(authenticated);
  }

  @Post('login')
  async loginLocal(@Body() payload: LoginLocalDto) {
    const authenticated = await this.authService.loginLocal(payload);
    return this.authService.buildLoginResponse(authenticated);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async googleAuth() {}

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(
    @Req() req: RequestWithUser<AuthenticatedUser>,
    @Res() res: Response,
    @Query('redirect_uri') redirectUri?: string,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('Google authentication failed');
    }

    const payload = this.authService.buildLoginResponse(req.user);
    const frontendUrl =
      redirectUri ?? this.configService.get<string>('auth.frontendAppUrl');

    if (frontendUrl) {
      const redirectUrl = new URL(frontendUrl);
      redirectUrl.searchParams.set('token', payload.jwt);
      redirectUrl.searchParams.set('userId', payload.user.id);
      redirectUrl.searchParams.set('displayName', payload.user.displayName);
      redirectUrl.searchParams.set('email', payload.user.email);
      return res.redirect(redirectUrl.toString());
    }

    return res.json(payload);
  }
}
