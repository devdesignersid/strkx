import { PartialType } from '@nestjs/mapped-types';
import { CreateProblemDto } from './create-problem.dto';
import { VALIDATION_LIMITS } from '../../common/constants/validation.constants';
import { Length, MaxLength, ArrayMaxSize, IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTestCaseDto, Difficulty } from './create-problem.dto';

export class UpdateProblemDto extends PartialType(CreateProblemDto) {
  @IsString()
  @IsOptional()
  @Length(1, VALIDATION_LIMITS.PROBLEM.TITLE_MAX_LENGTH)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(VALIDATION_LIMITS.PROBLEM.DESCRIPTION_MAX_LENGTH)
  description?: string;

  @IsString()
  @IsOptional()
  slug?: string;

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
  @IsOptional()
  testCases?: CreateTestCaseDto[];

  @IsOptional()
  timeoutMs?: number;

  @IsOptional()
  memoryLimitMb?: number;
}
