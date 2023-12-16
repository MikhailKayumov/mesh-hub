import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatar1702708151472 implements MigrationInterface {
  name = 'AddAvatar1702708151472';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users"."user_meta" ADD "avatar" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users"."user_meta" DROP COLUMN "avatar"`);
  }
}
