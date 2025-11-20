import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDiaryEntryDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @IsOptional()
  @IsDateString()
  entryDate?: string;
}
