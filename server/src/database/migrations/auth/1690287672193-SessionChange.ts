import { MigrationInterface, QueryRunner } from 'typeorm';

export class SessionChange1690287672193 implements MigrationInterface {
  name = 'SessionChange1690287672193';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth"."session" ADD CONSTRAINT "UQ_dd3bfba3a86f80dc44b1834cdf5" UNIQUE ("access_token")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auth"."session" DROP CONSTRAINT "UQ_dd3bfba3a86f80dc44b1834cdf5"`);
  }
}
