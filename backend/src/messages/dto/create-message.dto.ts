import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;
}