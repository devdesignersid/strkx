import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

export class CreateTestCaseDto {
  @IsString()
  input: string;

  @IsString()
  expectedOutput: string;
}

import { VALIDATION_LIMITS } from '../../common/constants/validation.constants';
import { Length, MaxLength, ArrayMaxSize } from 'class-validator';

// ... existing imports

export class CreateProblemDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, VALIDATION_LIMITS.PROBLEM.TITLE_MAX_LENGTH)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION_LIMITS.PROBLEM.DESCRIPTION_MAX_LENGTH)
  description: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  starterCode?: string;

  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @MaxLength(VALIDATION_LIMITS.PROBLEM.TAG_MAX_LENGTH, { each: true })
  @ArrayMaxSize(VALIDATION_LIMITS.PROBLEM.MAX_TAGS)
  tags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTestCaseDto)
  testCases: CreateTestCaseDto[];
}
