import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateInterviewSessionDto {
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  difficulty?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  status?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  lists?: string[];

  @IsInt()
  @Min(1)
  @IsOptional()
  questionCount?: number = 2;
}
