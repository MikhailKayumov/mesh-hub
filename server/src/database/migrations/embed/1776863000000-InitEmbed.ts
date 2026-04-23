import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitEmbed1776863000000 implements MigrationInterface {
  name = 'InitEmbed1776863000000';

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

    // Unique indexes — api_key
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c4f6ccad30c0862eb54af9fb0a" ON "embed"."api_key" ("prefix")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3c9751d2a6011ba13e27838105" ON "embed"."api_key" ("key_hash")`);

    // Index — embed_domain_whitelist
    await queryRunner.query(
      `CREATE INDEX "IDX_229c0ba88bd06b24680ac463cd" ON "embed"."embed_domain_whitelist" ("embed_project_id")`,
    );

    // Foreign keys — api_key
    await queryRunner.query(
      `ALTER TABLE "embed"."api_key" ADD CONSTRAINT "FK_80f6e510b9dbf92323d35e4c5d1" ` +
        `FOREIGN KEY ("org_id") REFERENCES "organizations"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Foreign keys — embed_project
    await queryRunner.query(
      `ALTER TABLE "embed"."embed_project" ADD CONSTRAINT "FK_82703f98b7b161931a9981539f5" ` +
        `FOREIGN KEY ("org_id") REFERENCES "organizations"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "embed"."embed_project" ADD CONSTRAINT "FK_ec90a72e66d1f0b2578e48542ea" ` +
        `FOREIGN KEY ("model_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Foreign keys — embed_domain_whitelist
    await queryRunner.query(
      `ALTER TABLE "embed"."embed_domain_whitelist" ADD CONSTRAINT "FK_229c0ba88bd06b24680ac463cdf" ` +
        `FOREIGN KEY ("embed_project_id") REFERENCES "embed"."embed_project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Foreign keys — model_view_log
    await queryRunner.query(
      `ALTER TABLE "embed"."model_view_log" ADD CONSTRAINT "FK_6f7238ceb5d5419a8e2d9dbf656" ` +
        `FOREIGN KEY ("model_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "embed"."model_view_log" ADD CONSTRAINT "FK_20193d9b169e9b4549b5fd17955" ` +
        `FOREIGN KEY ("embed_project_id") REFERENCES "embed"."embed_project"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "embed"."model_view_log" DROP CONSTRAINT "FK_20193d9b169e9b4549b5fd17955"`);
    await queryRunner.query(`ALTER TABLE "embed"."model_view_log" DROP CONSTRAINT "FK_6f7238ceb5d5419a8e2d9dbf656"`);
    await queryRunner.query(
      `ALTER TABLE "embed"."embed_domain_whitelist" DROP CONSTRAINT "FK_229c0ba88bd06b24680ac463cdf"`,
    );
    await queryRunner.query(`ALTER TABLE "embed"."embed_project" DROP CONSTRAINT "FK_ec90a72e66d1f0b2578e48542ea"`);
    await queryRunner.query(`ALTER TABLE "embed"."embed_project" DROP CONSTRAINT "FK_82703f98b7b161931a9981539f5"`);
    await queryRunner.query(`ALTER TABLE "embed"."api_key" DROP CONSTRAINT "FK_80f6e510b9dbf92323d35e4c5d1"`);
    await queryRunner.query(`DROP INDEX "embed"."IDX_229c0ba88bd06b24680ac463cd"`);
    await queryRunner.query(`DROP INDEX "embed"."IDX_3c9751d2a6011ba13e27838105"`);
    await queryRunner.query(`DROP INDEX "embed"."IDX_c4f6ccad30c0862eb54af9fb0a"`);

    await queryRunner.query(`DROP TABLE "embed"."model_view_log"`);
    await queryRunner.query(`DROP TABLE "embed"."embed_domain_whitelist"`);
    await queryRunner.query(`DROP TABLE "embed"."embed_project"`);
    await queryRunner.query(`DROP TABLE "embed"."api_key"`);
  }
}
