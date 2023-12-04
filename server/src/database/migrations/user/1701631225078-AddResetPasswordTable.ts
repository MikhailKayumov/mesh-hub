import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResetPasswordTable1701631225078 implements MigrationInterface {
  name = 'AddResetPasswordTable1701631225078';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users"."user_reset_password" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "expired_at" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "REL_c88e6b917ea23eba24be9d4c32" UNIQUE ("userId"), CONSTRAINT "PK_7375b15001ebb80cac091ea3589" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user_reset_password" ADD CONSTRAINT "FK_c88e6b917ea23eba24be9d4c32a" FOREIGN KEY ("userId") REFERENCES "users"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users"."user_reset_password" DROP CONSTRAINT "FK_c88e6b917ea23eba24be9d4c32a"`,
    );
    await queryRunner.query(`DROP TABLE "users"."user_reset_password"`);
  }
}
