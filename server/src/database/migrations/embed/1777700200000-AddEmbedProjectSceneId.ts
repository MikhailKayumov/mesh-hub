import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmbedProjectSceneId1777700200000 implements MigrationInterface {
  name = 'AddEmbedProjectSceneId1777700200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "embed"."embed_project" ADD COLUMN "scene_id" uuid`);

    await queryRunner.query(
      `ALTER TABLE "embed"."embed_project" ADD CONSTRAINT "FK_embed_project_scene_id" ` +
        `FOREIGN KEY ("scene_id") REFERENCES "scenes"."scene"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "embed"."embed_project" ADD CONSTRAINT "embed_project_target_check" ` +
        `CHECK (num_nonnulls("model_id", "scene_id") = 1)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "embed"."embed_project" DROP CONSTRAINT "embed_project_target_check"`);
    await queryRunner.query(`ALTER TABLE "embed"."embed_project" DROP CONSTRAINT "FK_embed_project_scene_id"`);
    await queryRunner.query(`ALTER TABLE "embed"."embed_project" DROP COLUMN "scene_id"`);
  }
}
