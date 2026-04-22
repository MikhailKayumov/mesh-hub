import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVisibility1704720192661 implements MigrationInterface {
  name = 'AddVisibility1704720192661';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "model_3d"."model_visibility" AS ENUM('public', 'private', 'unlisted')`);
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_3d" ADD COLUMN "visibility" "model_3d"."model_visibility" NOT NULL DEFAULT 'public'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d" DROP COLUMN "visibility"`);
    await queryRunner.query(`DROP TYPE "model_3d"."model_visibility"`);
  }
}
