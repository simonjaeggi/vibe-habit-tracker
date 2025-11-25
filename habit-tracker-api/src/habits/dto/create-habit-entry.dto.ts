import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateHabitEntryDto {
  @IsOptional()
  @IsDateString()
  entryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  textContent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  pictureUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  voiceMemoUrl?: string;
}
