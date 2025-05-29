// create-contact.dto.ts
import { IsString, IsEmail } from 'class-validator';

export class CreateContactDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}