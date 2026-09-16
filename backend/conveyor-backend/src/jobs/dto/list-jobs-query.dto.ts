import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { JobStatus } from '../job-status.enum';

export class ListJobsQueryDto {
  // `?status=` with no value means "no filter", not "filter by empty string".
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}
