import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Habit, HabitRecurrence } from './entities/habit.entity';
import { HabitEntry } from './entities/habit-entry.entity';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { CreateHabitEntryDto } from './dto/create-habit-entry.dto';
import { UpdateHabitEntryDto } from './dto/update-habit-entry.dto';

@Injectable()
export class HabitsService {
  constructor(
    @InjectRepository(Habit)
    private readonly habitRepository: Repository<Habit>,
    @InjectRepository(HabitEntry)
    private readonly habitEntryRepository: Repository<HabitEntry>,
  ) {}

  async createHabit(user: User, dto: CreateHabitDto) {
    const recurrence = this.normalizeRecurrence(dto.recurrence);
    const customIntervalDays = this.resolveCustomInterval(
      recurrence,
      dto.customIntervalDays,
    );

    const toggles = this.resolveRequirementToggles(dto);

    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Habit name cannot be empty.');
    }

    const habit = this.habitRepository.create({
      user,
      userId: user.id,
      name,
      recurrence,
      customIntervalDays,
      ...toggles,
    });

    return this.habitRepository.save(habit);
  }

  findAllHabits(user: User) {
    return this.habitRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });
  }

  findHabit(id: string, user: User) {
    return this.findHabitOrThrow(id, user);
  }

  async updateHabit(id: string, user: User, dto: UpdateHabitDto) {
    const habit = await this.findHabitOrThrow(id, user);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Habit name cannot be empty.');
      }
      habit.name = name;
    }

    if (dto.recurrence !== undefined) {
      habit.recurrence = this.normalizeRecurrence(dto.recurrence);
    }

    if (dto.customIntervalDays !== undefined || dto.recurrence !== undefined) {
      const desiredCustomInterval =
        habit.recurrence === 'custom'
          ? dto.customIntervalDays ?? habit.customIntervalDays ?? undefined
          : dto.customIntervalDays;

      habit.customIntervalDays = this.resolveCustomInterval(
        habit.recurrence,
        desiredCustomInterval,
      );
    }

    const toggles = this.resolveRequirementToggles(dto, habit);
    Object.assign(habit, toggles);

    return this.habitRepository.save(habit);
  }

  async removeHabit(id: string, user: User) {
    const habit = await this.findHabitOrThrow(id, user);
    await this.habitRepository.remove(habit);
    return { deleted: true };
  }

  async createEntry(
    habitId: string,
    user: User,
    dto: CreateHabitEntryDto,
  ) {
    const habit = await this.findHabitOrThrow(habitId, user);
    const entryDate = this.normalizeDate(dto.entryDate);

    this.assertEntryContentAllowed(habit, {
      textContent: dto.textContent,
      pictureUrl: dto.pictureUrl,
      voiceMemoUrl: dto.voiceMemoUrl,
    });

    const entry = this.habitEntryRepository.create({
      habit,
      habitId,
      user,
      userId: user.id,
      entryDate,
      textContent: dto.textContent?.trim(),
      pictureUrl: dto.pictureUrl?.trim(),
      voiceMemoUrl: dto.voiceMemoUrl?.trim(),
    });

    try {
      return await this.habitEntryRepository.save(entry);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT' || error.code === '23505') {
        throw new ConflictException(
          'An entry already exists for this date and habit.',
        );
      }

      throw error;
    }
  }

  async listEntries(habitId: string, user: User) {
    await this.findHabitOrThrow(habitId, user);
    return this.habitEntryRepository.find({
      where: { habitId, userId: user.id },
      order: { entryDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async findEntry(habitId: string, entryId: string, user: User) {
    await this.findHabitOrThrow(habitId, user);
    return this.findEntryOrThrow(entryId, habitId, user);
  }

  async updateEntry(
    habitId: string,
    entryId: string,
    user: User,
    dto: UpdateHabitEntryDto,
  ) {
    const habit = await this.findHabitOrThrow(habitId, user);
    const entry = await this.findEntryOrThrow(entryId, habitId, user);

    if (dto.entryDate !== undefined) {
      entry.entryDate = this.normalizeDate(dto.entryDate);
    }

    if (dto.textContent !== undefined) {
      entry.textContent = dto.textContent?.trim();
    }

    if (dto.pictureUrl !== undefined) {
      entry.pictureUrl = dto.pictureUrl?.trim();
    }

    if (dto.voiceMemoUrl !== undefined) {
      entry.voiceMemoUrl = dto.voiceMemoUrl?.trim();
    }

    this.assertEntryContentAllowed(habit, {
      textContent: entry.textContent,
      pictureUrl: entry.pictureUrl,
      voiceMemoUrl: entry.voiceMemoUrl,
    });

    try {
      return await this.habitEntryRepository.save(entry);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT' || error.code === '23505') {
        throw new ConflictException(
          'An entry already exists for this date and habit.',
        );
      }

      throw error;
    }
  }

  async removeEntry(habitId: string, entryId: string, user: User) {
    await this.findHabitOrThrow(habitId, user);
    const entry = await this.findEntryOrThrow(entryId, habitId, user);
    await this.habitEntryRepository.remove(entry);
    return { deleted: true };
  }

  private async findHabitOrThrow(id: string, user: User) {
    const habit = await this.habitRepository.findOne({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found.');
    }

    return habit;
  }

  private async findEntryOrThrow(
    entryId: string,
    habitId: string,
    user: User,
  ) {
    const entry = await this.habitEntryRepository.findOne({
      where: { id: entryId, habitId, userId: user.id },
    });

    if (!entry) {
      throw new NotFoundException('Habit entry not found.');
    }

    return entry;
  }

  private normalizeDate(date?: string) {
    const parsed = date ? new Date(date) : new Date();
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid date provided.');
    }

    return parsed.toISOString().slice(0, 10);
  }

  private normalizeRecurrence(recurrence: string): HabitRecurrence {
    const value = recurrence.toLowerCase() as HabitRecurrence;
    if (!['daily', 'weekly', 'monthly', 'custom'].includes(value)) {
      throw new BadRequestException('Invalid recurrence value.');
    }
    return value;
  }

  private resolveCustomInterval(
    recurrence: HabitRecurrence,
    customIntervalDays?: number,
  ) {
    if (recurrence === 'custom') {
      if (!customIntervalDays || customIntervalDays < 1) {
        throw new BadRequestException(
          'customIntervalDays must be provided for custom recurrence.',
        );
      }
      return customIntervalDays;
    }

    if (customIntervalDays !== undefined) {
      throw new BadRequestException(
        'customIntervalDays is only allowed for custom recurrence.',
      );
    }

    return null;
  }

  private resolveRequirementToggles(
    dto: Pick<
      CreateHabitDto | UpdateHabitDto,
      | 'allowText'
      | 'requireText'
      | 'allowPicture'
      | 'requirePicture'
      | 'allowVoiceMemo'
      | 'requireVoiceMemo'
    >,
    current?: Habit,
  ) {
    const allowText = dto.allowText ?? current?.allowText ?? false;
    const requireText = dto.requireText ?? current?.requireText ?? false;

    const allowPicture = dto.allowPicture ?? current?.allowPicture ?? false;
    const requirePicture = dto.requirePicture ?? current?.requirePicture ?? false;

    const allowVoiceMemo =
      dto.allowVoiceMemo ?? current?.allowVoiceMemo ?? false;
    const requireVoiceMemo =
      dto.requireVoiceMemo ?? current?.requireVoiceMemo ?? false;

    if (requireText && !allowText) {
      throw new BadRequestException(
        'allowText must be true when requireText is true.',
      );
    }

    if (requirePicture && !allowPicture) {
      throw new BadRequestException(
        'allowPicture must be true when requirePicture is true.',
      );
    }

    if (requireVoiceMemo && !allowVoiceMemo) {
      throw new BadRequestException(
        'allowVoiceMemo must be true when requireVoiceMemo is true.',
      );
    }

    return {
      allowText,
      requireText,
      allowPicture,
      requirePicture,
      allowVoiceMemo,
      requireVoiceMemo,
    };
  }

  private assertEntryContentAllowed(
    habit: Habit,
    content: {
      textContent?: string | null;
      pictureUrl?: string | null;
      voiceMemoUrl?: string | null;
    },
  ) {
    if (!habit.allowText && content.textContent) {
      throw new BadRequestException('Text is not allowed for this habit.');
    }

    if (!habit.allowPicture && content.pictureUrl) {
      throw new BadRequestException('Picture is not allowed for this habit.');
    }

    if (!habit.allowVoiceMemo && content.voiceMemoUrl) {
      throw new BadRequestException('Voice memo is not allowed for this habit.');
    }

    if (habit.requireText && !content.textContent) {
      throw new BadRequestException('Text is required for this habit.');
    }

    if (habit.requirePicture && !content.pictureUrl) {
      throw new BadRequestException('Picture is required for this habit.');
    }

    if (habit.requireVoiceMemo && !content.voiceMemoUrl) {
      throw new BadRequestException('Voice memo is required for this habit.');
    }
  }
}
