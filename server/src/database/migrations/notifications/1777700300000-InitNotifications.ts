import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitNotifications1777700300000 implements MigrationInterface {
  name = 'InitNotifications1777700300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "notifications"`);

    await queryRunner.query(`
      CREATE TABLE "notifications"."notification" (
        "id"         uuid         NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz  NOT NULL DEFAULT now(),
        "updated_at" timestamptz  DEFAULT now(),
        "deleted_at" timestamptz,
        "user_id"    uuid         NOT NULL,
        "type"       varchar(50)  NOT NULL,
        "payload"    jsonb        NOT NULL,
        "is_read"    boolean      NOT NULL DEFAULT false,
        CONSTRAINT "PK_notification" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_notification_user_id_is_read" ON "notifications"."notification" ("user_id", "is_read")`,
    );

    await queryRunner.query(
      `ALTER TABLE "notifications"."notification" ADD CONSTRAINT "FK_notification_user_id" ` +
        `FOREIGN KEY ("user_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notifications"."notification" DROP CONSTRAINT "FK_notification_user_id"`);
    await queryRunner.query(`DROP INDEX "notifications"."IDX_notification_user_id_is_read"`);
    await queryRunner.query(`DROP TABLE "notifications"."notification"`);
  }
}
