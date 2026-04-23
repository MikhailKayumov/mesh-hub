import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewsAndAnnotations1776929000000 implements MigrationInterface {
  name = 'AddReviewsAndAnnotations1776929000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // model_comment table
    await queryRunner.query(`
      CREATE TABLE "model_3d"."model_comment" (
        "id"         uuid              NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ       NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ       DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "body"       text              NOT NULL,
        "pos_x"      double precision,
        "pos_y"      double precision,
        "pos_z"      double precision,
        "resolved"   boolean           NOT NULL DEFAULT false,
        "model_id"   uuid              NOT NULL,
        "author_id"  uuid              NOT NULL,
        "parent_id"  uuid,
        CONSTRAINT "PK_model_comment" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_c2f04c5890af6074b7a067a4bb" ON "model_3d"."model_comment" ("model_id")`);

    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_comment" ADD CONSTRAINT "FK_c2f04c5890af6074b7a067a4bbf" ` +
        `FOREIGN KEY ("model_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_comment" ADD CONSTRAINT "FK_cdf36a19c10552a0525651d0f1b" ` +
        `FOREIGN KEY ("author_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_comment" ADD CONSTRAINT "FK_0c9f36846dc880eb102bfb5f62e" ` +
        `FOREIGN KEY ("parent_id") REFERENCES "model_3d"."model_comment"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // model_annotation table
    await queryRunner.query(`
      CREATE TABLE "model_3d"."model_annotation" (
        "id"            uuid             NOT NULL DEFAULT gen_random_uuid(),
        "created_at"    TIMESTAMPTZ      NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMPTZ      DEFAULT now(),
        "deleted_at"    TIMESTAMPTZ,
        "label"         varchar(50)      NOT NULL,
        "body"          text,
        "pos_x"         double precision NOT NULL,
        "pos_y"         double precision NOT NULL,
        "pos_z"         double precision NOT NULL,
        "camera_pos_x"  double precision,
        "camera_pos_y"  double precision,
        "camera_pos_z"  double precision,
        "order"         integer          NOT NULL DEFAULT 0,
        "model_id"      uuid             NOT NULL,
        CONSTRAINT "PK_model_annotation" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_b80aceefc003bd2f83134a52e3" ON "model_3d"."model_annotation" ("model_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_annotation" ADD CONSTRAINT "FK_b80aceefc003bd2f83134a52e33" ` +
        `FOREIGN KEY ("model_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_annotation" DROP CONSTRAINT "FK_b80aceefc003bd2f83134a52e33"`,
    );
    await queryRunner.query(`DROP INDEX "model_3d"."IDX_b80aceefc003bd2f83134a52e3"`);
    await queryRunner.query(`DROP TABLE "model_3d"."model_annotation"`);

    await queryRunner.query(`ALTER TABLE "model_3d"."model_comment" DROP CONSTRAINT "FK_0c9f36846dc880eb102bfb5f62e"`);
    await queryRunner.query(`ALTER TABLE "model_3d"."model_comment" DROP CONSTRAINT "FK_cdf36a19c10552a0525651d0f1b"`);
    await queryRunner.query(`ALTER TABLE "model_3d"."model_comment" DROP CONSTRAINT "FK_c2f04c5890af6074b7a067a4bbf"`);
    await queryRunner.query(`DROP INDEX "model_3d"."IDX_c2f04c5890af6074b7a067a4bb"`);
    await queryRunner.query(`DROP TABLE "model_3d"."model_comment"`);
  }
}
