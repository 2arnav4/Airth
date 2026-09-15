import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { JobStatus } from './job-status.enum';

@Index(['status', 'createdAt'])
@Entity({ name: 'jobs' })
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({
    type: 'enum',
    enum: JobStatus,
    enumName: 'job_status',
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
