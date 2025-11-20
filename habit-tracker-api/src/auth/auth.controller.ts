import {
  Controller,
  Get,
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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async googleAuth() {}

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(
    @Req() req: RequestWithUser<AuthenticatedUser>,
    @Res() res: Response,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('Google authentication failed');
    }

    const payload = this.authService.buildLoginResponse(req.user);
    const frontendUrl = this.configService.get<string>('auth.frontendAppUrl');

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
