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
          return {
            type: 'sqlite',
            database: dbConfig.path ?? 'vibe-habit-tracker.sqlite',
            entities: [User, DiaryEntry],
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

        return {
          type: dbConfig.type,
          url,
          entities: [User, DiaryEntry],
          autoLoadEntities: true,
          synchronize,
        } as TypeOrmModuleOptions;
      },
    }),
    UsersModule,
    AuthModule,
    DiaryEntriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
