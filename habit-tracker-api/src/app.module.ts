import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration, { AppConfig } from './config/configuration';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/user.entity';
import { DiaryEntriesModule } from './diary-entries/diary-entries.module';
import { DiaryEntry } from './diary-entries/entities/diary-entry.entity';
import { Habit } from './habits/entities/habit.entity';
import { HabitEntry } from './habits/entities/habit-entry.entity';
import { HabitsModule } from './habits/habits.module';
import { AddHabits1740000000000 } from './migrations/1740000000000-add-habits';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const dbConfig = configService.get<AppConfig['database']>('database');

        if (!dbConfig) {
          throw new Error('Database configuration is missing');
        }

        const synchronize = dbConfig.synchronize ?? true;

        if (dbConfig.type === 'sqlite') {
          const database =
            dbConfig.inMemory === true
              ? ':memory:'
              : dbConfig.path ?? 'vibe-habit-tracker.sqlite';

          return {
            type: 'sqlite',
            database,
            entities: [User, DiaryEntry, Habit, HabitEntry],
            migrations: [AddHabits1740000000000],
            autoLoadEntities: true,
            synchronize,
          };
        }

        const url = dbConfig.url;

        if (!url) {
          throw new Error(
            `DATABASE_URL must be provided when using ${dbConfig.type}`,
          );
        }

        const ssl =
          dbConfig.ssl === true
            ? { rejectUnauthorized: dbConfig.sslRejectUnauthorized !== false }
            : undefined;

        return {
          type: dbConfig.type,
          url,
          ssl,
          extra: ssl ? { ssl } : undefined,
          entities: [User, DiaryEntry, Habit, HabitEntry],
          migrations: [AddHabits1740000000000],
          autoLoadEntities: true,
          synchronize,
        } as TypeOrmModuleOptions;
      },
    }),
    UsersModule,
    AuthModule,
    DiaryEntriesModule,
    HabitsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
