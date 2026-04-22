import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitOrganizations1776862686884 implements MigrationInterface {
  name = 'InitOrganizations1776862686884';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enum types
    await queryRunner.query(
      `CREATE TYPE "organizations"."organization_plan_type_enum" AS ENUM('starter', 'growth', 'enterprise')`,
    );
    await queryRunner.query(
      `CREATE TYPE "organizations"."org_member_role_enum" AS ENUM('owner', 'admin', 'editor', 'viewer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "organizations"."org_invite_role_enum" AS ENUM('owner', 'admin', 'editor', 'viewer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "organizations"."org_subscription_storage_backend_enum" AS ENUM('local', 's3')`,
    );

    // organizations.organization
    await queryRunner.query(
      `CREATE TABLE "organizations"."organization" (` +
        `"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"deleted_at" TIMESTAMP WITH TIME ZONE, ` +
        `"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), ` +
        `"id" uuid NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"name" text NOT NULL, ` +
        `"slug" text NOT NULL, ` +
        `"plan_type" "organizations"."organization_plan_type_enum" NOT NULL DEFAULT 'starter', ` +
        `CONSTRAINT "UQ_org_slug" UNIQUE ("slug"), ` +
        `CONSTRAINT "PK_org" PRIMARY KEY ("id")` +
        `)`,
    );

    // organizations.org_member
    await queryRunner.query(
      `CREATE TABLE "organizations"."org_member" (` +
        `"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"deleted_at" TIMESTAMP WITH TIME ZONE, ` +
        `"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), ` +
        `"id" uuid NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"role" "organizations"."org_member_role_enum" NOT NULL, ` +
        `"org_id" uuid NOT NULL, ` +
        `"user_id" uuid NOT NULL, ` +
        `CONSTRAINT "UQ_3887c571683d00674628d8bf2f0" UNIQUE ("org_id", "user_id"), ` +
        `CONSTRAINT "PK_org_member" PRIMARY KEY ("id")` +
        `)`,
    );

    // organizations.org_subscription
    await queryRunner.query(
      `CREATE TABLE "organizations"."org_subscription" (` +
        `"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"deleted_at" TIMESTAMP WITH TIME ZONE, ` +
        `"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), ` +
        `"id" uuid NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"storage_limit_bytes" bigint, ` +
        `"seats_limit" integer, ` +
        `"storage_backend" "organizations"."org_subscription_storage_backend_enum" NOT NULL DEFAULT 'local', ` +
        `"storage_config_encrypted" text, ` +
        `"org_id" uuid NOT NULL, ` +
        `CONSTRAINT "UQ_org_subscription_org_id" UNIQUE ("org_id"), ` +
        `CONSTRAINT "PK_org_subscription" PRIMARY KEY ("id")` +
        `)`,
    );

    // organizations.org_invite
    await queryRunner.query(
      `CREATE TABLE "organizations"."org_invite" (` +
        `"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"deleted_at" TIMESTAMP WITH TIME ZONE, ` +
        `"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), ` +
        `"id" uuid NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"invited_email" text NOT NULL, ` +
        `"role" "organizations"."org_invite_role_enum" NOT NULL, ` +
        `"token" uuid NOT NULL, ` +
        `"expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, ` +
        `"accepted_at" TIMESTAMP WITH TIME ZONE, ` +
        `"org_id" uuid NOT NULL, ` +
        `CONSTRAINT "UQ_org_invite_token" UNIQUE ("token"), ` +
        `CONSTRAINT "PK_org_invite" PRIMARY KEY ("id")` +
        `)`,
    );

    // Foreign keys
    await queryRunner.query(
      `ALTER TABLE "organizations"."org_member" ADD CONSTRAINT "FK_5cbc4503718aea4e7b545b63e6f" ` +
        `FOREIGN KEY ("org_id") REFERENCES "organizations"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."org_member" ADD CONSTRAINT "FK_167aa0aeb690d602164c1626acb" ` +
        `FOREIGN KEY ("user_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."org_subscription" ADD CONSTRAINT "FK_e8a787b7bfb98c3362ea2828db5" ` +
        `FOREIGN KEY ("org_id") REFERENCES "organizations"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."org_invite" ADD CONSTRAINT "FK_e6b32476348fdee37b11c54bd33" ` +
        `FOREIGN KEY ("org_id") REFERENCES "organizations"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations"."org_invite" DROP CONSTRAINT "FK_e6b32476348fdee37b11c54bd33"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."org_subscription" DROP CONSTRAINT "FK_e8a787b7bfb98c3362ea2828db5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."org_member" DROP CONSTRAINT "FK_167aa0aeb690d602164c1626acb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."org_member" DROP CONSTRAINT "FK_5cbc4503718aea4e7b545b63e6f"`,
    );

    await queryRunner.query(`DROP TABLE "organizations"."org_invite"`);
    await queryRunner.query(`DROP TABLE "organizations"."org_subscription"`);
    await queryRunner.query(`DROP TABLE "organizations"."org_member"`);
    await queryRunner.query(`DROP TABLE "organizations"."organization"`);

    await queryRunner.query(`DROP TYPE "organizations"."org_subscription_storage_backend_enum"`);
    await queryRunner.query(`DROP TYPE "organizations"."org_invite_role_enum"`);
    await queryRunner.query(`DROP TYPE "organizations"."org_member_role_enum"`);
    await queryRunner.query(`DROP TYPE "organizations"."organization_plan_type_enum"`);
  }
}
