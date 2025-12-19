import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class ExecuteCodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000, { message: 'Code must not exceed 50,000 characters' })
  code: string;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsNotEmpty()
  problemSlug: string;

  @IsString()
  @IsOptional()
  mode?: 'run' | 'submit';
}
