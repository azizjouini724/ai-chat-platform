import { IsString, IsArray, ArrayMinSize, MinLength, MaxLength } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @IsArray()
  @ArrayMinSize(2, { message: 'Un groupe doit avoir au moins 2 autres membres' })
  @IsString({ each: true })
  memberIds!: string[];
}