import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaryEntry } from './entities/diary-entry.entity';
import { DiaryEntriesService } from './diary-entries.service';
import { DiaryEntriesController } from './diary-entries.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([DiaryEntry]), UsersModule],
  controllers: [DiaryEntriesController],
  providers: [DiaryEntriesService],
})
export class DiaryEntriesModule {}
