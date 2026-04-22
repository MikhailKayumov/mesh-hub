import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitWorkspaces1776862709317 implements MigrationInterface {
  name = 'InitWorkspaces1776862709317';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enum types
    await queryRunner.query(`CREATE TYPE "workspaces"."workspace_member_role_enum" AS ENUM('editor', 'viewer')`);

    // workspaces.workspace
    await queryRunner.query(
      `CREATE TABLE "workspaces"."workspace" (` +
        `"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"deleted_at" TIMESTAMP WITH TIME ZONE, ` +
        `"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), ` +
        `"id" uuid NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"name" text NOT NULL, ` +
        `"org_id" uuid NOT NULL, ` +
        `CONSTRAINT "PK_workspace" PRIMARY KEY ("id")` +
        `)`,
    );

    // workspaces.workspace_member
    await queryRunner.query(
      `CREATE TABLE "workspaces"."workspace_member" (` +
        `"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"deleted_at" TIMESTAMP WITH TIME ZONE, ` +
        `"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), ` +
        `"id" uuid NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"role" "workspaces"."workspace_member_role_enum" NOT NULL, ` +
        `"workspace_id" uuid NOT NULL, ` +
        `"user_id" uuid NOT NULL, ` +
        `CONSTRAINT "UQ_0eab76d5a9c509930a9f3d7a104" UNIQUE ("workspace_id", "user_id"), ` +
        `CONSTRAINT "PK_workspace_member" PRIMARY KEY ("id")` +
        `)`,
    );

    // Foreign keys
    await queryRunner.query(
      `ALTER TABLE "workspaces"."workspace" ADD CONSTRAINT "FK_a5498b79ec16741b57e976105ee" ` +
        `FOREIGN KEY ("org_id") REFERENCES "organizations"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces"."workspace_member" ADD CONSTRAINT "FK_73d466cb93234025fe379fa5873" ` +
        `FOREIGN KEY ("workspace_id") REFERENCES "workspaces"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces"."workspace_member" ADD CONSTRAINT "FK_82b74268d8b7e1574fd744b3903" ` +
        `FOREIGN KEY ("user_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspaces"."workspace_member" DROP CONSTRAINT "FK_82b74268d8b7e1574fd744b3903"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces"."workspace_member" DROP CONSTRAINT "FK_73d466cb93234025fe379fa5873"`,
    );
    await queryRunner.query(`ALTER TABLE "workspaces"."workspace" DROP CONSTRAINT "FK_a5498b79ec16741b57e976105ee"`);
    await queryRunner.query(`DROP TABLE "workspaces"."workspace_member"`);
    await queryRunner.query(`DROP TABLE "workspaces"."workspace"`);

    await queryRunner.query(`DROP TYPE "workspaces"."workspace_member_role_enum"`);
  }
}
