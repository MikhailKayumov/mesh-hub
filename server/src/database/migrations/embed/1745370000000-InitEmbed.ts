import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitEmbed1745370000000 implements MigrationInterface {
  name = 'InitEmbed1745370000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // embed.api_key
    await queryRunner.query(
      `CREATE TABLE "embed"."api_key" (` +
        `"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"deleted_at" TIMESTAMP WITH TIME ZONE, ` +
        `"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), ` +
        `"id" uuid NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"name" text NOT NULL, ` +
        `"prefix" varchar(8) NOT NULL, ` +
        `"key_hash" text NOT NULL, ` +
        `"last_used_at" TIMESTAMP WITH TIME ZONE, ` +
        `"expires_at" TIMESTAMP WITH TIME ZONE, ` +
        `"revoked_at" TIMESTAMP WITH TIME ZONE, ` +
        `"org_id" uuid NOT NULL, ` +
        `CONSTRAINT "UQ_api_key_prefix" UNIQUE ("prefix"), ` +
        `CONSTRAINT "UQ_api_key_hash" UNIQUE ("key_hash"), ` +
        `CONSTRAINT "PK_api_key" PRIMARY KEY ("id")` +
        `)`,
    );

    // embed.embed_project
    await queryRunner.query(
      `CREATE TABLE "embed"."embed_project" (` +
        `"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"deleted_at" TIMESTAMP WITH TIME ZONE, ` +
        `"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), ` +
        `"id" uuid NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"name" text NOT NULL, ` +
        `"branding_config" json, ` +
        `"auto_rotate" boolean NOT NULL DEFAULT false, ` +
        `"org_id" uuid NOT NULL, ` +
        `"model_id" uuid, ` +
        `CONSTRAINT "PK_embed_project" PRIMARY KEY ("id")` +
        `)`,
    );

    // embed.embed_domain_whitelist
    await queryRunner.query(
      `CREATE TABLE "embed"."embed_domain_whitelist" (` +
        `"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"deleted_at" TIMESTAMP WITH TIME ZONE, ` +
        `"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), ` +
        `"id" SERIAL NOT NULL, ` +
        `"domain" text NOT NULL, ` +
        `"embed_project_id" uuid NOT NULL, ` +
        `CONSTRAINT "PK_embed_domain_whitelist" PRIMARY KEY ("id")` +
        `)`,
    );

    // embed.model_view_log
    await queryRunner.query(
      `CREATE TABLE "embed"."model_view_log" (` +
        `"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"deleted_at" TIMESTAMP WITH TIME ZONE, ` +
        `"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), ` +
        `"id" SERIAL NOT NULL, ` +
        `"origin" text, ` +
        `"duration_seconds" integer, ` +
        `"model_id" uuid NOT NULL, ` +
        `"embed_project_id" uuid, ` +
        `CONSTRAINT "PK_model_view_log" PRIMARY KEY ("id")` +
        `)`,
    );

    // Foreign keys — api_key
    await queryRunner.query(
      `ALTER TABLE "embed"."api_key" ADD CONSTRAINT "FK_api_key_org_id" ` +
        `FOREIGN KEY ("org_id") REFERENCES "organizations"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Foreign keys — embed_project
    await queryRunner.query(
      `ALTER TABLE "embed"."embed_project" ADD CONSTRAINT "FK_embed_project_org_id" ` +
        `FOREIGN KEY ("org_id") REFERENCES "organizations"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "embed"."embed_project" ADD CONSTRAINT "FK_embed_project_model_id" ` +
        `FOREIGN KEY ("model_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Foreign keys — embed_domain_whitelist
    await queryRunner.query(
      `ALTER TABLE "embed"."embed_domain_whitelist" ADD CONSTRAINT "FK_embed_domain_whitelist_project_id" ` +
        `FOREIGN KEY ("embed_project_id") REFERENCES "embed"."embed_project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Foreign keys — model_view_log
    await queryRunner.query(
      `ALTER TABLE "embed"."model_view_log" ADD CONSTRAINT "FK_model_view_log_model_id" ` +
        `FOREIGN KEY ("model_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "embed"."model_view_log" ADD CONSTRAINT "FK_model_view_log_embed_project_id" ` +
        `FOREIGN KEY ("embed_project_id") REFERENCES "embed"."embed_project"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_embed_domain_whitelist_project_id" ON "embed"."embed_domain_whitelist" ("embed_project_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_model_view_log_embed_project_created" ON "embed"."model_view_log" ("embed_project_id", "created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "embed"."IDX_model_view_log_embed_project_created"`);
    await queryRunner.query(`DROP INDEX "embed"."IDX_embed_domain_whitelist_project_id"`);

    await queryRunner.query(
      `ALTER TABLE "embed"."model_view_log" DROP CONSTRAINT "FK_model_view_log_embed_project_id"`,
    );
    await queryRunner.query(`ALTER TABLE "embed"."model_view_log" DROP CONSTRAINT "FK_model_view_log_model_id"`);
    await queryRunner.query(
      `ALTER TABLE "embed"."embed_domain_whitelist" DROP CONSTRAINT "FK_embed_domain_whitelist_project_id"`,
    );
    await queryRunner.query(`ALTER TABLE "embed"."embed_project" DROP CONSTRAINT "FK_embed_project_model_id"`);
    await queryRunner.query(`ALTER TABLE "embed"."embed_project" DROP CONSTRAINT "FK_embed_project_org_id"`);
    await queryRunner.query(`ALTER TABLE "embed"."api_key" DROP CONSTRAINT "FK_api_key_org_id"`);

    await queryRunner.query(`DROP TABLE "embed"."model_view_log"`);
    await queryRunner.query(`DROP TABLE "embed"."embed_domain_whitelist"`);
    await queryRunner.query(`DROP TABLE "embed"."embed_project"`);
    await queryRunner.query(`DROP TABLE "embed"."api_key"`);
  }
}
