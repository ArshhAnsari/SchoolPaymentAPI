import { Type } from 'class-transformer'; // Import Type for nested object transformation
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEmail,
  IsUrl,
  ValidateNested,
} from 'class-validator';

// Creating DTO for student information
class StudentInfoDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  id: string;

  @IsEmail()
  email: string;
}

// Creating DTO for the transaction
export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  school_id: string;

  @IsNumber()
  amount: number;

  @IsUrl()
  @IsNotEmpty()
  callback_url: string;

  @ValidateNested()
  @Type(() => StudentInfoDto)
  student_info: StudentInfoDto;
}