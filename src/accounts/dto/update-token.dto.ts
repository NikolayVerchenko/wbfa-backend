import { IsString, MinLength } from 'class-validator';

export class UpdateTokenDto {
  @IsString()
  @MinLength(10)
  token!: string;
}
