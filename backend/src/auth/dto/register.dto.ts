import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores (_)',
  })
  username!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}