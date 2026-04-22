import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class OrganizationCreateRequestDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public name: string;

  @ApiProperty({ maxLength: 50, pattern: '^[a-z0-9-]+$' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug may only contain lowercase letters, digits and hyphens' })
  @MaxLength(50)
  public slug: string;
}
