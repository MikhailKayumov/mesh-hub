import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitUserEntity1690136120229 implements MigrationInterface {
  name = 'InitUserEntity1690136120229';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users"."user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "last_login_date" TIMESTAMP WITH TIME ZONE, "email" text NOT NULL, "password" text NOT NULL, "nickname" text, "first_name" text, "middle_name" text, "last_name" text, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"."user"`);
  }
}
