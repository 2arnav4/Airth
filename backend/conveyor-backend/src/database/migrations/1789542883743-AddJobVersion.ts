import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobVersion1789542883743 implements MigrationInterface {
    name = 'AddJobVersion1789542883743'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" ADD "version" integer NOT NULL DEFAULT '1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "version"`);
    }

}
