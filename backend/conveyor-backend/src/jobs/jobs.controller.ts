import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { ListJobsQueryDto } from './dto/list-jobs-query.dto';
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
}
