import { MigrationInterface, QueryRunner } from 'typeorm';

export class SessionAddRefreshToken1691005741636 implements MigrationInterface {
  name = 'SessionAddRefreshToken1691005741636';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auth"."session" ADD "refresh_token" text NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "auth"."session" ADD CONSTRAINT "UQ_14f5d9fd42ee29c579807b5f7e5" UNIQUE ("refresh_token")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auth"."session" DROP CONSTRAINT "UQ_14f5d9fd42ee29c579807b5f7e5"`);
    await queryRunner.query(`ALTER TABLE "auth"."session" DROP COLUMN "refresh_token"`);
  }
}
