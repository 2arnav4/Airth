import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPriority1789536246043 implements MigrationInterface {
    name = 'AddPriority1789536246043'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" ADD "priority" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "priority"`);
    }

}
