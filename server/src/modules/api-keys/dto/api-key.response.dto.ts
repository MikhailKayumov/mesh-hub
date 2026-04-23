import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public name: string;

  @ApiProperty()
  public prefix: string;

  @ApiProperty({ nullable: true })
  public lastUsedAt: Date | null;

  @ApiProperty({ nullable: true })
  public expiresAt: Date | null;

  @ApiProperty({ nullable: true })
  public revokedAt: Date | null;

  /** Present only in the create response — shown once, never stored. */
  @ApiProperty({ nullable: true })
  public rawKey?: string;
}
