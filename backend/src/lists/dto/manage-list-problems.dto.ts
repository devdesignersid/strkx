import { IsArray, IsString, IsNotEmpty, ArrayNotEmpty } from 'class-validator';

export class ManageListProblemsDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  problemIds: string[];
}
