import { IsEnum, IsOptional } from 'class-validator';
import { JobStatus } from '../job-status.enum';

export class ListJobsQueryDto {
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}
