import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPersonalScenes1777400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "scenes"."scene_visibility" AS ENUM ('public', 'private', 'unlisted')
    `);

    await queryRunner.query(`
      ALTER TABLE "scenes"."scene"
        ALTER COLUMN "workspace_id" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "scenes"."scene"
        ADD COLUMN "user_id" uuid REFERENCES "users"."user" ("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "scenes"."scene"
        ADD COLUMN "visibility" "scenes"."scene_visibility" NOT NULL DEFAULT 'private'
    `);

    await queryRunner.query(`
      ALTER TABLE "scenes"."scene"
        ADD CONSTRAINT "CHK_scene_owner" CHECK ("user_id" IS NOT NULL OR "workspace_id" IS NOT NULL)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "scenes"."scene" DROP CONSTRAINT "CHK_scene_owner"
    `);

    await queryRunner.query(`
      ALTER TABLE "scenes"."scene" DROP COLUMN "visibility"
    `);

    await queryRunner.query(`
      ALTER TABLE "scenes"."scene" DROP COLUMN "user_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "scenes"."scene"
        ALTER COLUMN "workspace_id" SET NOT NULL
    `);

    await queryRunner.query(`
      DROP TYPE "scenes"."scene_visibility"
    `);
  }
}
