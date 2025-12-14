import { IsString, IsNotEmpty, IsOptional, IsInt, IsObject, IsEnum } from 'class-validator';

export class CreateSystemDesignSubmissionDto {
  @IsString()
  @IsNotEmpty()
  problemId: string;

  @IsObject()
  @IsNotEmpty()
  excalidrawJson: any;

  @IsString()
  @IsOptional()
  notesMarkdown?: string;

  @IsInt()
  @IsOptional()
  timeSpentSeconds?: number;

  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdateSystemDesignSubmissionDto {
  @IsObject()
  @IsOptional()
  excalidrawJson?: any;

  @IsString()
  @IsOptional()
  notesMarkdown?: string;

  @IsInt()
  @IsOptional()
  timeSpentSeconds?: number;

  @IsString()
  @IsOptional()
  status?: string;
}

export class MarkSolutionDto {
  @IsString()
  @IsOptional()
  solutionName?: string;
}
