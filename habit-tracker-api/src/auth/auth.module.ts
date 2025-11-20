import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { HeaderUserGuard } from './guards/header-user.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({
      session: false,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, HeaderUserGuard],
  exports: [HeaderUserGuard],
})
export class AuthModule {}
