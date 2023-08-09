import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserAddSalt1690215560345 implements MigrationInterface {
  name = 'UserAddSalt1690215560345';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users"."user" ADD "salt" text NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users"."user" DROP COLUMN "salt"`);
  }
}
