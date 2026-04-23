import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModelVersions1776930000000 implements MigrationInterface {
  name = 'AddModelVersions1776930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create model_version table
    await queryRunner.query(`
      CREATE TABLE "model_3d"."model_version" (
        "id"             uuid              NOT NULL DEFAULT gen_random_uuid(),
        "created_at"     timestamptz       NOT NULL DEFAULT now(),
        "updated_at"     timestamptz,
        "deleted_at"     timestamptz,
        "version_number" integer           NOT NULL DEFAULT 1,
        "file_name"      text              NOT NULL,
        "file_size"      bigint            NOT NULL,
        "mime_type"      text              NOT NULL,
        "entry_file"     text,
        "change_notes"   varchar(500),
        "is_active"      boolean           NOT NULL DEFAULT false,
        "model_id"       uuid              NOT NULL,
        "uploader_id"    uuid              NOT NULL,
        CONSTRAINT "PK_model_version" PRIMARY KEY ("id"),
        CONSTRAINT "FK_model_version_model" FOREIGN KEY ("model_id")
          REFERENCES "model_3d"."model_3d" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_model_version_uploader" FOREIGN KEY ("uploader_id")
          REFERENCES "users"."user" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_model_version_model_id" ON "model_3d"."model_version" ("model_id")
    `);

    // Add current_version_id column to model_3d
    await queryRunner.query(`
      ALTER TABLE "model_3d"."model_3d"
        ADD COLUMN "current_version_id" uuid
    `);

    // Backfill: create initial version (v1, active) for every existing model
    await queryRunner.query(`
      INSERT INTO "model_3d"."model_version"
        ("model_id", "uploader_id", "version_number", "file_name", "file_size", "mime_type", "entry_file", "is_active", "created_at")
      SELECT
        m.id,
        m.user_id,
        1,
        COALESCE(f.entry_file, f.name),
        f.size,
        CASE
          WHEN f.extension = '.glb'  THEN 'model/gltf-binary'
          WHEN f.extension = '.gltf' THEN 'model/gltf+json'
          WHEN f.extension = '.zip'  THEN 'application/zip'
          ELSE 'application/octet-stream'
        END,
        f.entry_file,
        true,
        m.created_at
      FROM "model_3d"."model_3d" m
      JOIN "model_3d"."model_3d_file" f ON f.id = m.file_id
      WHERE m.deleted_at IS NULL
    `);

    // Set current_version_id for backfilled models
    await queryRunner.query(`
      UPDATE "model_3d"."model_3d" m
        SET current_version_id = v.id
      FROM "model_3d"."model_version" v
      WHERE v.model_id = m.id
        AND v.is_active = true
        AND m.deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "model_3d"."model_3d"
        DROP COLUMN IF EXISTS "current_version_id"
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "model_3d"."IDX_model_version_model_id"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "model_3d"."model_version"`);
  }
}
