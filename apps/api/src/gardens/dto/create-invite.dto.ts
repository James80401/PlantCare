import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateInviteDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsIn(['CAREGIVER', 'VIEWER'])
  role!: 'CAREGIVER' | 'VIEWER';
}
