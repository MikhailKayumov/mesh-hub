import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModelAudio1777500000000 implements MigrationInterface {
  name = 'AddModelAudio1777500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "model_3d"."model_audio" (
        "id"            uuid          NOT NULL DEFAULT gen_random_uuid(),
        "created_at"    timestamptz   NOT NULL DEFAULT now(),
        "updated_at"    timestamptz,
        "deleted_at"    timestamptz,
        "model_id"      uuid          NOT NULL,
        "filename"      varchar(255)  NOT NULL,
        "original_name" varchar(255)  NOT NULL,
        "duration_s"    float8,
        CONSTRAINT "PK_model_audio"       PRIMARY KEY ("id"),
        CONSTRAINT "FK_model_audio_model" FOREIGN KEY ("model_id")
          REFERENCES "model_3d"."model_3d" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_model_audio_model_id" ON "model_3d"."model_audio" ("model_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "model_3d"."IDX_model_audio_model_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "model_3d"."model_audio"`);
  }
}
