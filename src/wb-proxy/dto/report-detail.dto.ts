import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ReportDetailByPeriodDto {
  @IsDateString()
  dateFrom!: string;

  @IsDateString()
  dateTo!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rrdid?: number;

  @IsOptional()
  @IsString()
  period?: 'daily' | 'weekly';
}
