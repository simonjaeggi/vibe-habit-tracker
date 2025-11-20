import { Request } from 'express';
import { User } from '../../users/entities/user.entity';

export interface RequestWithUser<TUser = User> extends Request {
  user?: TUser;
}
