import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsIn(['low', 'medium', 'high'])
  severity: string;

  @IsString()
  @IsNotEmpty()
  reporterPhone: string;
}
