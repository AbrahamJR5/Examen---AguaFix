import { MigrationInterface, QueryRunner } from "typeorm";

export class InitReports1789146221869 implements MigrationInterface {
    name = 'InitReports1789146221869'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "WATER_REPORT" ("id" SERIAL NOT NULL, "address" character varying NOT NULL, "description" character varying NOT NULL, "severity" character varying NOT NULL, "reporterPhone" character varying NOT NULL, "isResolved" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b232cdd6d3e95978564720c2ebe" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "WATER_REPORT"`);
    }

}
