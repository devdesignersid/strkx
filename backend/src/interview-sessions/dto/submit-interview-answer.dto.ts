import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitInterviewAnswerDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsNotEmpty()
  status: string; // ACCEPTED, WRONG_ANSWER, etc.

  @IsString()
  @IsOptional()
  output?: string;

  @IsBoolean()
  @IsOptional()
  autoSubmitted?: boolean;
}
