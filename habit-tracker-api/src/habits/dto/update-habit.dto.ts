import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

const RECURRENCE_OPTIONS = ['daily', 'weekly', 'monthly', 'custom'] as const;

export class UpdateHabitDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsIn(RECURRENCE_OPTIONS as unknown as string[])
  recurrence?: (typeof RECURRENCE_OPTIONS)[number];

  @IsOptional()
  @IsInt()
  @IsPositive()
  customIntervalDays?: number;

  @IsOptional()
  @IsBoolean()
  allowText?: boolean;

  @IsOptional()
  @IsBoolean()
  requireText?: boolean;

  @IsOptional()
  @IsBoolean()
  allowPicture?: boolean;

  @IsOptional()
  @IsBoolean()
  requirePicture?: boolean;

  @IsOptional()
  @IsBoolean()
  allowVoiceMemo?: boolean;

  @IsOptional()
  @IsBoolean()
  requireVoiceMemo?: boolean;
}
