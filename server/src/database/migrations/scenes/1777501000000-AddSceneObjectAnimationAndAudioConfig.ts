import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSceneObjectAnimationAndAudioConfig1777501000000 implements MigrationInterface {
  name = 'AddSceneObjectAnimationAndAudioConfig1777501000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "scenes"."scene_object"
        ADD COLUMN "animation_config" jsonb,
        ADD COLUMN "audio_config"     jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "scenes"."scene_object"
        DROP COLUMN IF EXISTS "animation_config",
        DROP COLUMN IF EXISTS "audio_config"
    `);
  }
}
