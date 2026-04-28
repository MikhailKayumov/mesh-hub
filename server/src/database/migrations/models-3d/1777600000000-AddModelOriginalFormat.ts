import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModelOriginalFormat1777600000000 implements MigrationInterface {
  name = 'AddModelOriginalFormat1777600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_3d_file" ADD "original_format" varchar(10) NOT NULL DEFAULT 'glb'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d_file" DROP COLUMN "original_format"`);
  }
}
