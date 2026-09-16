import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateJobsTable1789494010327 implements MigrationInterface {
    name = 'CreateJobsTable1789494010327'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TYPE "public"."job_status" AS ENUM('pending', 'running', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(200) NOT NULL, "type" character varying(50) NOT NULL, "status" "public"."job_status" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c2130d1d7e7f4408202a36e4f1" ON "jobs" ("status", "created_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_c2130d1d7e7f4408202a36e4f1"`);
        await queryRunner.query(`DROP TABLE "jobs"`);
        await queryRunner.query(`DROP TYPE "public"."job_status"`);
    }

}
