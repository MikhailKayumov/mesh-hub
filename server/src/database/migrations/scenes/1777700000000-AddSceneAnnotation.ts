import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSceneAnnotation1777700000000 implements MigrationInterface {
  name = 'AddSceneAnnotation1777700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "scenes"."scene_annotation" (
        "id"               uuid             NOT NULL DEFAULT gen_random_uuid(),
        "created_at"       TIMESTAMPTZ      NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMPTZ      DEFAULT now(),
        "deleted_at"       TIMESTAMPTZ,
        "scene_id"         uuid             NOT NULL,
        "scene_object_id"  uuid,
        "user_id"          uuid             NOT NULL,
        "label"            varchar(120)     NOT NULL,
        "body"             text,
        "pos_x"            double precision NOT NULL,
        "pos_y"            double precision NOT NULL,
        "pos_z"            double precision NOT NULL,
        "camera_pos_x"     double precision,
        "camera_pos_y"     double precision,
        "camera_pos_z"     double precision,
        "order"            integer          NOT NULL DEFAULT 0,
        CONSTRAINT "PK_scene_annotation" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_scene_annotation_scene_id" ON "scenes"."scene_annotation" ("scene_id")`);

    await queryRunner.query(
      `ALTER TABLE "scenes"."scene_annotation" ADD CONSTRAINT "FK_scene_annotation_scene_id" ` +
        `FOREIGN KEY ("scene_id") REFERENCES "scenes"."scene"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "scenes"."scene_annotation" ADD CONSTRAINT "FK_scene_annotation_scene_object_id" ` +
        `FOREIGN KEY ("scene_object_id") REFERENCES "scenes"."scene_object"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "scenes"."scene_annotation" ADD CONSTRAINT "FK_scene_annotation_user_id" ` +
        `FOREIGN KEY ("user_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "scenes"."scene_annotation" DROP CONSTRAINT "FK_scene_annotation_user_id"`);
    await queryRunner.query(
      `ALTER TABLE "scenes"."scene_annotation" DROP CONSTRAINT "FK_scene_annotation_scene_object_id"`,
    );
    await queryRunner.query(`ALTER TABLE "scenes"."scene_annotation" DROP CONSTRAINT "FK_scene_annotation_scene_id"`);
    await queryRunner.query(`DROP INDEX "scenes"."IDX_scene_annotation_scene_id"`);
    await queryRunner.query(`DROP TABLE "scenes"."scene_annotation"`);
  }
}
