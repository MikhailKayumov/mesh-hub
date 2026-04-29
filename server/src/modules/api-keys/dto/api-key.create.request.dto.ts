import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsIn, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiKeyScope, ApiKeyScopes } from '@/modules/api-keys/api-key.constants';

export class ApiKeyCreateRequestDto {
  @ApiProperty()
  @IsUUID()
  public orgId: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public name: string;

  @ApiProperty({ enum: ApiKeyScopes, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(ApiKeyScopes, { each: true })
  public scopes: ApiKeyScope[];
}
