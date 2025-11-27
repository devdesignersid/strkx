import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ExecuteCodeDto {
  @IsString()
  @IsNotEmpty()
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
