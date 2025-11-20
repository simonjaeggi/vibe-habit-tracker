import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleProfilePayload, User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { googleId },
    });
  }

  async upsertGoogleUser(payload: GoogleProfilePayload): Promise<User> {
    let user = await this.findByGoogleId(payload.googleId);

    if (!user) {
      user = this.usersRepository.create({
        googleId: payload.googleId,
        provider: 'google',
        email: payload.email,
        displayName: payload.displayName,
        picture: payload.picture,
      });
    } else {
      user.email = payload.email;
      user.displayName = payload.displayName;
      if (payload.picture !== undefined) {
        user.picture = payload.picture;
      }
    }

    return this.usersRepository.save(user);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }
}
