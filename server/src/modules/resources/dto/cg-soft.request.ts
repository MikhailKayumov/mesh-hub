import { ApiProperty } from '@nestjs/swagger';
import { IsString, Validate } from 'class-validator';
import { IsNumberOrStringDecorator } from '@/decorators/validation/is-number-or-string.decorator';

export class CgSoftRequest {
  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'number' }] })
  @Validate(IsNumberOrStringDecorator)
  public id: number | string;

  @ApiProperty()
  @IsString()
  public name: string;
}
