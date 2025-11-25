import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterLocalDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  displayName!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
