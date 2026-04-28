import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModelMaterialOverride1777404000000 implements MigrationInterface {
  name = 'AddModelMaterialOverride1777404000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "model_3d"."model_material_override" (
        "id"                  uuid          NOT NULL DEFAULT gen_random_uuid(),
        "created_at"          timestamptz   NOT NULL DEFAULT now(),
        "updated_at"          timestamptz,
        "deleted_at"          timestamptz,
        "model_id"            uuid          NOT NULL,
        "mesh_name"           varchar(255)  NOT NULL,
        "color_hex"           varchar(9),
        "metalness"           float8,
        "roughness"           float8,
        "emissive_hex"        varchar(9),
        "emissive_intensity"  float8,
        "opacity"             float8,
        "wireframe"           boolean       NOT NULL DEFAULT false,
        "texture_map_path"    text,
        "normal_map_path"     text,
        "roughness_map_path"  text,
        "metalness_map_path"  text,
        "emissive_map_path"   text,
        "ao_map_path"         text,
        CONSTRAINT "PK_model_material_override"         PRIMARY KEY ("id"),
        CONSTRAINT "UQ_model_material_override_mesh"    UNIQUE ("model_id", "mesh_name"),
        CONSTRAINT "FK_model_material_override_model"   FOREIGN KEY ("model_id")
          REFERENCES "model_3d"."model_3d" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_model_material_override_model_id"
        ON "model_3d"."model_material_override" ("model_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "model_3d"."IDX_model_material_override_model_id"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "model_3d"."model_material_override"
    `);
  }
}
