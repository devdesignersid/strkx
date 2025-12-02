import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

import { VALIDATION_LIMITS } from '../../common/constants/validation.constants';
import { Length, MaxLength } from 'class-validator';

// ... existing imports

export class CreateListDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, VALIDATION_LIMITS.LIST.NAME_MAX_LENGTH)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(VALIDATION_LIMITS.LIST.DESCRIPTION_MAX_LENGTH)
  description?: string;
}
