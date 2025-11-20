import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDiaryEntryDto {
  @IsString()
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsDateString()
  entryDate?: string;
}
