import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { CreateHabitEntryDto } from './dto/create-habit-entry.dto';
import { UpdateHabitEntryDto } from './dto/update-habit-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('habits')
@UseGuards(JwtAuthGuard)
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  createHabit(@CurrentUser() user: User, @Body() dto: CreateHabitDto) {
    return this.habitsService.createHabit(user, dto);
  }

  @Get()
  findAllHabits(@CurrentUser() user: User) {
    return this.habitsService.findAllHabits(user);
  }

  @Get(':id')
  findHabit(@Param('id') id: string, @CurrentUser() user: User) {
    return this.habitsService.findHabit(id, user);
  }

  @Patch(':id')
  updateHabit(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateHabitDto,
  ) {
    return this.habitsService.updateHabit(id, user, dto);
  }

  @Delete(':id')
  removeHabit(@Param('id') id: string, @CurrentUser() user: User) {
    return this.habitsService.removeHabit(id, user);
  }

  @Post(':habitId/entries')
  createEntry(
    @Param('habitId') habitId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateHabitEntryDto,
  ) {
    return this.habitsService.createEntry(habitId, user, dto);
  }

  @Get(':habitId/entries')
  listEntries(
    @Param('habitId') habitId: string,
    @CurrentUser() user: User,
  ) {
    return this.habitsService.listEntries(habitId, user);
  }

  @Get(':habitId/entries/:entryId')
  findEntry(
    @Param('habitId') habitId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: User,
  ) {
    return this.habitsService.findEntry(habitId, entryId, user);
  }

  @Patch(':habitId/entries/:entryId')
  updateEntry(
    @Param('habitId') habitId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateHabitEntryDto,
  ) {
    return this.habitsService.updateEntry(habitId, entryId, user, dto);
  }

  @Delete(':habitId/entries/:entryId')
  removeEntry(
    @Param('habitId') habitId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: User,
  ) {
    return this.habitsService.removeEntry(habitId, entryId, user);
  }
}
