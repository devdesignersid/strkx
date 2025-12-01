import { IsString, IsNotEmpty, IsArray, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Difficulty } from '@prisma/client';

export class CreateSystemDesignProblemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsInt()
  @Min(1)
  @IsOptional()
  defaultDuration?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  constraints?: string[];
}

export class UpdateSystemDesignProblemDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsInt()
  @Min(1)
  @IsOptional()
  defaultDuration?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  constraints?: string[];
}
