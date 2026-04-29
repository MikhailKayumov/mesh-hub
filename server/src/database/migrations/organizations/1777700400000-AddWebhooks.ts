import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWebhooks1777700400000 implements MigrationInterface {
  name = 'AddWebhooks1777700400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "organizations"."webhook" (
        "id"         uuid          NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz   NOT NULL DEFAULT now(),
        "updated_at" timestamptz   DEFAULT now(),
        "deleted_at" timestamptz,
        "org_id"     uuid          NOT NULL,
        "url"        text          NOT NULL,
        "events"     text[]        NOT NULL,
        "secret"     varchar(255)  NOT NULL,
        "is_active"  boolean       NOT NULL DEFAULT true,
        CONSTRAINT "PK_webhook" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_webhook_org_id" ON "organizations"."webhook" ("org_id")`);

    await queryRunner.query(
      `ALTER TABLE "organizations"."webhook" ADD CONSTRAINT "FK_webhook_org_id" ` +
        `FOREIGN KEY ("org_id") REFERENCES "organizations"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`
      CREATE TABLE "organizations"."webhook_delivery_log" (
        "id"              uuid         NOT NULL DEFAULT gen_random_uuid(),
        "created_at"      timestamptz  NOT NULL DEFAULT now(),
        "updated_at"      timestamptz  DEFAULT now(),
        "deleted_at"      timestamptz,
        "webhook_id"      uuid         NOT NULL,
        "event"           varchar(50)  NOT NULL,
        "payload"         jsonb        NOT NULL,
        "response_status" int,
        "delivered_at"    timestamptz,
        "failed_at"       timestamptz,
        CONSTRAINT "PK_webhook_delivery_log" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_webhook_delivery_log_webhook_id" ON "organizations"."webhook_delivery_log" ("webhook_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "organizations"."webhook_delivery_log" ADD CONSTRAINT "FK_webhook_delivery_log_webhook_id" ` +
        `FOREIGN KEY ("webhook_id") REFERENCES "organizations"."webhook"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations"."webhook_delivery_log" DROP CONSTRAINT "FK_webhook_delivery_log_webhook_id"`,
    );
    await queryRunner.query(`DROP INDEX "organizations"."IDX_webhook_delivery_log_webhook_id"`);
    await queryRunner.query(`DROP TABLE "organizations"."webhook_delivery_log"`);

    await queryRunner.query(`ALTER TABLE "organizations"."webhook" DROP CONSTRAINT "FK_webhook_org_id"`);
    await queryRunner.query(`DROP INDEX "organizations"."IDX_webhook_org_id"`);
    await queryRunner.query(`DROP TABLE "organizations"."webhook"`);
  }
}
