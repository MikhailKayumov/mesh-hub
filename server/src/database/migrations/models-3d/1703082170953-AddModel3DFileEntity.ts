import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModel3DFileEntity1703082170953 implements MigrationInterface {
  name = 'AddModel3DFileEntity1703082170953';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d" RENAME COLUMN "file" TO "file_id"`);
    await queryRunner.query(
      `CREATE TABLE "model_3d"."model_3d_file" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "size" bigint NOT NULL, "extension" text NOT NULL, CONSTRAINT "PK_57b840bb4c53dd66a6042b0dcaa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d" DROP COLUMN "file_id"`);
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d" ADD "file_id" uuid NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_3d" ADD CONSTRAINT "UQ_57b840bb4c53dd66a6042b0dcaa" UNIQUE ("file_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_3d" ADD CONSTRAINT "FK_57b840bb4c53dd66a6042b0dcaa" FOREIGN KEY ("file_id") REFERENCES "model_3d"."model_3d_file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d" DROP CONSTRAINT "FK_57b840bb4c53dd66a6042b0dcaa"`);
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d" DROP CONSTRAINT "UQ_57b840bb4c53dd66a6042b0dcaa"`);
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d" DROP COLUMN "file_id"`);
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d" ADD "file_id" text NOT NULL`);
    await queryRunner.query(`DROP TABLE "model_3d"."model_3d_file"`);
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d" RENAME COLUMN "file_id" TO "file"`);
  }
}
