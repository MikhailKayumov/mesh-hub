import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModelDisplayConfig1777402000000 implements MigrationInterface {
  name = 'AddModelDisplayConfig1777402000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "model_3d"."model_display_config" (
        "id"                    uuid          NOT NULL DEFAULT gen_random_uuid(),
        "created_at"            timestamptz   NOT NULL DEFAULT now(),
        "updated_at"            timestamptz,
        "deleted_at"            timestamptz,
        "model_id"              uuid          NOT NULL,
        "background_color"      varchar(9)    NOT NULL DEFAULT '#000000',
        "ambient_intensity"     float8        NOT NULL DEFAULT 0.5,
        "environment_hdri_path" text,
        "fog_enabled"           boolean       NOT NULL DEFAULT false,
        "fog_type"              varchar(10)   NOT NULL DEFAULT 'linear',
        "fog_color"             varchar(9)    NOT NULL DEFAULT '#cccccc',
        "fog_near"              float8        NOT NULL DEFAULT 10,
        "fog_far"               float8        NOT NULL DEFAULT 100,
        "post_process"          jsonb,
        "renderer_config"       jsonb,
        CONSTRAINT "PK_model_display_config"     PRIMARY KEY ("id"),
        CONSTRAINT "UQ_model_display_config_model" UNIQUE ("model_id"),
        CONSTRAINT "FK_model_display_config_model" FOREIGN KEY ("model_id")
          REFERENCES "model_3d"."model_3d" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "model_3d"."model_light" (
        "id"          uuid        NOT NULL DEFAULT gen_random_uuid(),
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        "updated_at"  timestamptz,
        "deleted_at"  timestamptz,
        "model_id"    uuid        NOT NULL,
        "type"        varchar(15) NOT NULL,
        "pos_x"       float8      NOT NULL DEFAULT 0,
        "pos_y"       float8      NOT NULL DEFAULT 5,
        "pos_z"       float8      NOT NULL DEFAULT 5,
        "color"       varchar(9)  NOT NULL DEFAULT '#ffffff',
        "intensity"   float8      NOT NULL DEFAULT 1.0,
        "cast_shadow" boolean     NOT NULL DEFAULT true,
        CONSTRAINT "PK_model_light" PRIMARY KEY ("id"),
        CONSTRAINT "FK_model_light_model" FOREIGN KEY ("model_id")
          REFERENCES "model_3d"."model_3d" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_model_light_model_id" ON "model_3d"."model_light" ("model_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "model_3d"."IDX_model_light_model_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "model_3d"."model_light"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "model_3d"."model_display_config"`);
  }
}
