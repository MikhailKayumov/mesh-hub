import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVisibility1704720192661 implements MigrationInterface {
  name = 'AddVisibility1704720192661';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d" ADD "isVisible" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d" DROP COLUMN "isVisible"`);
  }
}
