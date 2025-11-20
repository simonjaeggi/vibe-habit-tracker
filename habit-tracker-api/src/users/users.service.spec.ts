import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { DiaryEntry } from '../diary-entries/entities/diary-entry.entity';

describe('UsersService (with TypeORM)', () => {
  let service: UsersService;
  let dataSource: DataSource;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [User, DiaryEntry],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [UsersService],
    }).compile();

    service = moduleRef.get(UsersService);
    dataSource = moduleRef.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.getRepository(User).clear();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('creates a user from a Google profile', async () => {
    const user = await service.upsertGoogleUser({
      googleId: 'google-1',
      email: 'user@test.dev',
      displayName: 'Test User',
      picture: 'https://example.com/pic.png',
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('user@test.dev');
    expect(user.provider).toBe('google');

    const stored = await service.findByGoogleId('google-1');
    expect(stored?.id).toEqual(user.id);
  });

  it('updates the existing user when Google sends new profile data', async () => {
    await service.upsertGoogleUser({
      googleId: 'google-2',
      email: 'old@test.dev',
      displayName: 'Old Name',
    });

    const updated = await service.upsertGoogleUser({
      googleId: 'google-2',
      email: 'new@test.dev',
      displayName: 'New Name',
      picture: 'https://example.com/new.png',
    });

    expect(updated.email).toBe('new@test.dev');
    expect(updated.displayName).toBe('New Name');
    expect(updated.picture).toBe('https://example.com/new.png');

    const allUsers = await service.findAll();
    expect(allUsers).toHaveLength(1);
  });
});
