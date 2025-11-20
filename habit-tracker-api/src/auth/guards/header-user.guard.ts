import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

export const USER_ID_HEADER = 'x-user-id';

@Injectable()
export class HeaderUserGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithUser>();

    const headerValue = this.extractHeaderValue(request);

    if (!headerValue) {
      throw new UnauthorizedException(
        `Missing ${USER_ID_HEADER} header in request`,
      );
    }

    const user = await this.usersService.findById(headerValue);

    if (!user) {
      throw new UnauthorizedException(
        'User not found. Ensure you are sending a valid X-User-Id header.',
      );
    }

    request.user = user;
    return true;
  }

  private extractHeaderValue(
    request: RequestWithUser,
  ): string | undefined {
    const value = request.headers[USER_ID_HEADER] ?? request.headers['x-user-id'];

    if (!value) {
      return undefined;
    }

    return Array.isArray(value) ? value[0] : value;
  }
}
