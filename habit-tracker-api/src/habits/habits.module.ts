import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabitsService } from './habits.service';
import { HabitsController } from './habits.controller';
import { Habit } from './entities/habit.entity';
import { HabitEntry } from './entities/habit-entry.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Habit, HabitEntry]), UsersModule],
  controllers: [HabitsController],
  providers: [HabitsService],
})
export class HabitsModule {}
