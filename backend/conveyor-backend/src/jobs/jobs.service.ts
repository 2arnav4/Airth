import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateJobDto } from './dto/create-job.dto';
import { JobStatus } from './job-status.enum';
import { Job } from './job.entity';
import { statusesThatCanBecome } from './job-transitions';

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
  async updateStatus(id: string, next: JobStatus): Promise<Job> {
    const allowedFrom = statusesThatCanBecome(next);

    if (allowedFrom.length > 0) {
      const result = await this.jobsRepository.update(
        { id, status: In(allowedFrom) },
        { status: next },
      );

      if (result.affected === 1) {
        return this.findOneOrFail(id);
      }
    }

    const job = await this.jobsRepository.findOneBy({ id });

    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    throw new ConflictException(
      `Cannot change status from "${job.status}" to "${next}"`,
    );
  }

  private async findOneOrFail(id: string): Promise<Job> {
    const job = await this.jobsRepository.findOneBy({ id });

    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    return job;
  }
}
