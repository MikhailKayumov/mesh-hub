import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkspaceId1776867566495 implements MigrationInterface {
  name = 'AddWorkspaceId1776867566495';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d" ADD "workspace_id" uuid`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d" DROP COLUMN "workspace_id"`);
  }
}
