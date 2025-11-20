import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaryEntriesService } from './diary-entries.service';
import { DiaryEntry } from './entities/diary-entry.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

describe('DiaryEntriesService', () => {
  let service: DiaryEntriesService;
  let usersService: UsersService;
  let user: User;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          synchronize: true,
          entities: [User, DiaryEntry],
        }),
        TypeOrmModule.forFeature([User, DiaryEntry]),
      ],
      providers: [DiaryEntriesService, UsersService],
    }).compile();

    service = moduleRef.get(DiaryEntriesService);
    usersService = moduleRef.get(UsersService);

    user = await usersService.upsertGoogleUser({
      googleId: 'google-test',
      email: 'diary@test.dev',
      displayName: 'Diary Tester',
    });
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('creates and retrieves diary entries for a user', async () => {
    const created = await service.create(user, {
      content: 'Today I started journaling.',
    });

    expect(created.id).toBeDefined();
    expect(created.content).toContain('journaling');

    const entries = await service.findAllForUser(user);
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe(created.id);
  });

  it('prevents duplicate entries for the same date', async () => {
    await service.create(user, {
      content: 'Morning reflection',
      entryDate: '2024-01-10',
    });

    await expect(
      service.create(user, {
        content: 'Duplicate entry',
        entryDate: '2024-01-10',
      }),
    ).rejects.toThrow('A diary entry already exists for this date.');
  });
});
