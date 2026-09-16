import {
  Injectable,
  ConflictException,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
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

  /**
   * Moves a job to `next`.
   *
   * The transition rule lives in the WHERE clause, so the check and the write
   * are a single atomic statement: concurrent callers cannot both succeed.
   *
   * `expectedVersion` (from an If-Match header) additionally refuses the write
   * if the job changed at all since the client last read it.
   */
  async updateStatus(
    id: string,
    next: JobStatus,
    expectedVersion?: number,
  ): Promise<Job> {
    const allowedFrom = statusesThatCanBecome(next);

    if (allowedFrom.length > 0) {
      const criteria: FindOptionsWhere<Job> = {
        id,
        status: In(allowedFrom),
      };

      if (expectedVersion !== undefined) {
        criteria.version = expectedVersion;
      }

      const result = await this.jobsRepository.update(criteria, {
        status: next,
        version: () => '"version" + 1',
      });

      if (result.affected === 1) {
        return this.findOneOrFail(id);
      }
    }

    // Nothing was updated. Work out why, so the client gets the right code.
    const job = await this.jobsRepository.findOneBy({ id });

    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    if (expectedVersion !== undefined && job.version !== expectedVersion) {
      throw new PreconditionFailedException(
        `Job was modified by someone else (expected version ${expectedVersion}, current version ${job.version})`,
      );
    }

    throw new ConflictException(
      `Cannot change status from "${job.status}" to "${next}"`,
    );
  }

  async remove(id: string): Promise<void> {
    const result = await this.jobsRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException(`Job ${id} not found`);
    }
  }

  async countByStatus(): Promise<Record<JobStatus, number>> {
    const rows = await this.jobsRepository
      .createQueryBuilder('job')
      .select('job.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('job.status')
      .getRawMany<{ status: JobStatus; count: string }>();

    const counts: Record<JobStatus, number> = {
      [JobStatus.PENDING]: 0,
      [JobStatus.RUNNING]: 0,
      [JobStatus.COMPLETED]: 0,
      [JobStatus.FAILED]: 0,
    };

    for (const row of rows) {
      counts[row.status] = Number(row.count);
    }

    return counts;
  }

  private async findOneOrFail(id: string): Promise<Job> {
    const job = await this.jobsRepository.findOneBy({ id });

    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    return job;
  }
}
