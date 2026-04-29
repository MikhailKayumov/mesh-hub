import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApiKeyScopes1777700500000 implements MigrationInterface {
  name = 'AddApiKeyScopes1777700500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "embed"."api_key" ADD COLUMN "scopes" text[] NOT NULL DEFAULT ARRAY['embed:read']`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "embed"."api_key" DROP COLUMN "scopes"`);
  }
}
