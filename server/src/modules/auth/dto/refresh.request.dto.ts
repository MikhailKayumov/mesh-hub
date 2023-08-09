import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RefreshRequestDto {
  @IsUUID()
  public userId: string;

  @IsNotEmpty()
  @IsString()
  public token: string;
}
