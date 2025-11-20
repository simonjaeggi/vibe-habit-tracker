import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { DiaryEntry } from './entities/diary-entry.entity';
import { CreateDiaryEntryDto } from './dto/create-diary-entry.dto';
import { UpdateDiaryEntryDto } from './dto/update-diary-entry.dto';

@Injectable()
export class DiaryEntriesService {
  constructor(
    @InjectRepository(DiaryEntry)
    private readonly diaryRepository: Repository<DiaryEntry>,
  ) {}

  async create(user: User, dto: CreateDiaryEntryDto) {
    const entryDate = this.normalizeDate(dto.entryDate);
    const entry = this.diaryRepository.create({
      user,
      userId: user.id,
      entryDate,
      content: dto.content.trim(),
    });

    try {
      return await this.diaryRepository.save(entry);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT' || error.code === '23505') {
        throw new ConflictException(
          'A diary entry already exists for this date.',
        );
      }

      throw error;
    }
  }

  findAllForUser(user: User) {
    return this.diaryRepository.find({
      where: { userId: user.id },
      order: { entryDate: 'DESC', createdAt: 'DESC' },
    });
  }

  findOne(id: string, user: User) {
    return this.findEntryOrThrow(id, user);
  }

  async update(id: string, user: User, dto: UpdateDiaryEntryDto) {
    const entry = await this.findEntryOrThrow(id, user);

    if (dto.content !== undefined) {
      entry.content = dto.content.trim();
    }

    if (dto.entryDate !== undefined) {
      entry.entryDate = this.normalizeDate(dto.entryDate);
    }

    return this.diaryRepository.save(entry);
  }

  async remove(id: string, user: User) {
    const entry = await this.findEntryOrThrow(id, user);
    await this.diaryRepository.remove(entry);

    return { deleted: true };
  }

  private async findEntryOrThrow(id: string, user: User) {
    const entry = await this.diaryRepository.findOne({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!entry) {
      throw new NotFoundException('Diary entry not found.');
    }

    return entry;
  }

  private normalizeDate(date?: string) {
    const parsed = date ? new Date(date) : new Date();
    if (Number.isNaN(parsed.getTime())) {
      throw new ConflictException('Invalid date provided.');
    }

    return parsed.toISOString().slice(0, 10);
  }
}
