import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitScenes1776940000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "scenes"`);

    await queryRunner.query(`
      CREATE TYPE "scenes"."light_type" AS ENUM ('directional', 'point', 'spot')
    `);

    await queryRunner.query(`
      CREATE TABLE "scenes"."scene" (
        "id"             uuid          NOT NULL DEFAULT gen_random_uuid(),
        "created_at"     timestamptz   NOT NULL DEFAULT now(),
        "updated_at"     timestamptz,
        "deleted_at"     timestamptz,
        "name"           varchar(100)  NOT NULL,
        "description"    text,
        "config"         jsonb,
        "thumbnail_path" text,
        "workspace_id"   uuid          NOT NULL,
        CONSTRAINT "PK_scene" PRIMARY KEY ("id"),
        CONSTRAINT "FK_scene_workspace" FOREIGN KEY ("workspace_id")
          REFERENCES "workspaces"."workspace" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "scenes"."scene_object" (
        "id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz,
        "deleted_at" timestamptz,
        "pos_x"      float8      NOT NULL DEFAULT 0,
        "pos_y"      float8      NOT NULL DEFAULT 0,
        "pos_z"      float8      NOT NULL DEFAULT 0,
        "rot_x"      float8      NOT NULL DEFAULT 0,
        "rot_y"      float8      NOT NULL DEFAULT 0,
        "rot_z"      float8      NOT NULL DEFAULT 0,
        "scale_x"    float8      NOT NULL DEFAULT 1,
        "scale_y"    float8      NOT NULL DEFAULT 1,
        "scale_z"    float8      NOT NULL DEFAULT 1,
        "order"      int         NOT NULL DEFAULT 0,
        "scene_id"   uuid        NOT NULL,
        "model_id"   uuid        NOT NULL,
        CONSTRAINT "PK_scene_object" PRIMARY KEY ("id"),
        CONSTRAINT "FK_scene_object_scene" FOREIGN KEY ("scene_id")
          REFERENCES "scenes"."scene" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_scene_object_model" FOREIGN KEY ("model_id")
          REFERENCES "model_3d"."model_3d" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_scene_object_scene_id" ON "scenes"."scene_object" ("scene_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "scenes"."scene_light" (
        "id"          uuid                  NOT NULL DEFAULT gen_random_uuid(),
        "created_at"  timestamptz           NOT NULL DEFAULT now(),
        "updated_at"  timestamptz,
        "deleted_at"  timestamptz,
        "type"        "scenes"."light_type" NOT NULL,
        "pos_x"       float8                NOT NULL DEFAULT 0,
        "pos_y"       float8                NOT NULL DEFAULT 0,
        "pos_z"       float8                NOT NULL DEFAULT 0,
        "color"       varchar(7)            NOT NULL DEFAULT '#ffffff',
        "intensity"   float8                NOT NULL DEFAULT 1.0,
        "cast_shadow" boolean               NOT NULL DEFAULT true,
        "scene_id"    uuid                  NOT NULL,
        CONSTRAINT "PK_scene_light" PRIMARY KEY ("id"),
        CONSTRAINT "FK_scene_light_scene" FOREIGN KEY ("scene_id")
          REFERENCES "scenes"."scene" ("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "scenes"."scene_light"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "scenes"."IDX_scene_object_scene_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "scenes"."scene_object"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "scenes"."scene"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "scenes"."light_type"`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS "scenes"`);
  }
}
