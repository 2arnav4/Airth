import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreateJobDto } from './dto/create-job.dto';
import { ListJobsQueryDto } from './dto/list-jobs-query.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { JobStatus } from './job-status.enum';
import { Job } from './job.entity';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  create(@Body() dto: CreateJobDto): Promise<Job> {
    return this.jobsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListJobsQueryDto): Promise<Job[]> {
    return this.jobsService.findAll(query.status);
  }

  // Declared before any ':id' route so that "stats" is never read as an id.
  @Get('stats')
  stats(): Promise<Record<JobStatus, number>> {
    return this.jobsService.countByStatus();
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobStatusDto,
    @Res({ passthrough: true }) response: Response,
    @Headers('if-match') ifMatch?: string,
  ): Promise<Job> {
    const job = await this.jobsService.updateStatus(
      id,
      dto.status,
      parseIfMatch(ifMatch),
    );

    response.setHeader('ETag', `"${job.version}"`);

    return job;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.jobsService.remove(id);
  }
}

/**
 * An If-Match header carries the version the client last saw, optionally
 * quoted as an ETag: `If-Match: "3"`. Absent means "no version check".
 */
function parseIfMatch(ifMatch?: string): number | undefined {
  if (ifMatch === undefined) {
    return undefined;
  }

  const version = Number(ifMatch.trim().replace(/^"|"$/g, ''));

  if (!Number.isInteger(version) || version < 1) {
    throw new BadRequestException('If-Match must be a job version number');
  }

  return version;
}
