import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJobDto } from './dto/create-job.dto';
import { JobStatus } from './job-status.enum';
import { Job } from './job.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
  ) {}

  create(dto: CreateJobDto): Promise<Job> {
    const job = this.jobsRepository.create({
      title: dto.title,
      type: dto.type,
      priority: dto.priority ?? 0,
    });

    return this.jobsRepository.save(job);
  }

  findAll(status?: JobStatus): Promise<Job[]> {
    return this.jobsRepository.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
    });
  }
}
