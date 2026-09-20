import { IsString, IsNotEmpty } from 'class-validator';

export class SetReactionDto {
  @IsString()
  @IsNotEmpty()
  emoji!: string;
}