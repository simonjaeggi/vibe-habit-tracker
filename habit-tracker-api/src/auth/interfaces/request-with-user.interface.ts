import { Request } from 'express';
import { User } from '../../users/entities/user.entity';
import { AuthenticatedUser } from './authenticated-user.interface';

export interface RequestWithUser<
  TUser extends User | AuthenticatedUser = User,
> extends Request {
  user?: TUser;
}
