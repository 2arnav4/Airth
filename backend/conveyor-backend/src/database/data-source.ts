import { DataSource } from 'typeorm';
import { Job } from '../jobs/job.entity';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run migrations');
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [Job],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
