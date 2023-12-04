import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserConfirmationStatuAndSessionIpAgentData1701202637094 implements MigrationInterface {
  name = 'AddUserConfirmationStatuAndSessionIpAgentData1701202637094';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users"."user" ADD "is_confirmed" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "auth"."session" ADD "ip" inet NOT NULL`);
    await queryRunner.query(`ALTER TABLE "auth"."session" ADD "user_agent" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auth"."session" DROP COLUMN "user_agent"`);
    await queryRunner.query(`ALTER TABLE "auth"."session" DROP COLUMN "ip"`);
    await queryRunner.query(`ALTER TABLE "users"."user" DROP COLUMN "is_confirmed"`);
  }
}
