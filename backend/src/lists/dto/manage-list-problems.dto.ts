import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class ManageListProblemsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  problemIds: string[];
}
