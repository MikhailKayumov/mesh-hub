import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSceneComment1777700100000 implements MigrationInterface {
  name = 'AddSceneComment1777700100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "scenes"."scene_comment" (
        "id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "scene_id"   uuid        NOT NULL,
        "author_id"  uuid        NOT NULL,
        "parent_id"  uuid,
        "body"       text        NOT NULL,
        "resolved"   boolean     NOT NULL DEFAULT false,
        CONSTRAINT "PK_scene_comment" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_scene_comment_scene_id" ON "scenes"."scene_comment" ("scene_id")`);

    await queryRunner.query(`CREATE INDEX "IDX_scene_comment_parent_id" ON "scenes"."scene_comment" ("parent_id")`);

    await queryRunner.query(
      `ALTER TABLE "scenes"."scene_comment" ADD CONSTRAINT "FK_scene_comment_scene_id" ` +
        `FOREIGN KEY ("scene_id") REFERENCES "scenes"."scene"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "scenes"."scene_comment" ADD CONSTRAINT "FK_scene_comment_author_id" ` +
        `FOREIGN KEY ("author_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "scenes"."scene_comment" ADD CONSTRAINT "FK_scene_comment_parent_id" ` +
        `FOREIGN KEY ("parent_id") REFERENCES "scenes"."scene_comment"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "scenes"."scene_comment" DROP CONSTRAINT "FK_scene_comment_parent_id"`);
    await queryRunner.query(`ALTER TABLE "scenes"."scene_comment" DROP CONSTRAINT "FK_scene_comment_author_id"`);
    await queryRunner.query(`ALTER TABLE "scenes"."scene_comment" DROP CONSTRAINT "FK_scene_comment_scene_id"`);
    await queryRunner.query(`DROP INDEX "scenes"."IDX_scene_comment_parent_id"`);
    await queryRunner.query(`DROP INDEX "scenes"."IDX_scene_comment_scene_id"`);
    await queryRunner.query(`DROP TABLE "scenes"."scene_comment"`);
  }
}
