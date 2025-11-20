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
import { DiaryEntriesService } from './diary-entries.service';
import { CreateDiaryEntryDto } from './dto/create-diary-entry.dto';
import { UpdateDiaryEntryDto } from './dto/update-diary-entry.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HeaderUserGuard } from '../auth/guards/header-user.guard';
import { User } from '../users/entities/user.entity';

@Controller('diary')
@UseGuards(HeaderUserGuard)
export class DiaryEntriesController {
  constructor(private readonly diaryEntriesService: DiaryEntriesService) {}

  @Post()
  create(
    @CurrentUser() user: User,
    @Body() createDiaryEntryDto: CreateDiaryEntryDto,
  ) {
    return this.diaryEntriesService.create(user, createDiaryEntryDto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.diaryEntriesService.findAllForUser(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.diaryEntriesService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateDiaryEntryDto: UpdateDiaryEntryDto,
  ) {
    return this.diaryEntriesService.update(id, user, updateDiaryEntryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.diaryEntriesService.remove(id, user);
  }
}
