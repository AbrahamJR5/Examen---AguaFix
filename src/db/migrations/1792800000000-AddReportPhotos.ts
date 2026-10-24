import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReportPhotos1792800000000 implements MigrationInterface {
  name = 'AddReportPhotos1792800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "WATER_REPORT"
      ADD COLUMN "photoUrl" character varying,
      ADD COLUMN "repairPhotoUrl" character varying`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "WATER_REPORT"
      DROP COLUMN "repairPhotoUrl", DROP COLUMN "photoUrl"`);
  }
}
