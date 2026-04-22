import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEntryFile1776874651523 implements MigrationInterface {
  name = 'AddEntryFile1776874651523';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d_file" ADD "entry_file" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d_file" DROP COLUMN "entry_file"`);
  }
}
