import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

/**
 * Domain must be a hostname-only value: no protocol, no path, no port (optional port allowed).
 * Valid:   example.com, sub.example.com, localhost
 * Invalid: https://example.com, example.com/path
 */
export class DomainAddRequestDto {
  @ApiProperty({ example: 'example.com' })
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9]([a-zA-Z0-9-.]*[a-zA-Z0-9])?(:[0-9]+)?$/, {
    message: 'domain must be a valid hostname (no protocol, no path)',
  })
  public domain: string;
}
