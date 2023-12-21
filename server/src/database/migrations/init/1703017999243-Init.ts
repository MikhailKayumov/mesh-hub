import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1703017999243 implements MigrationInterface {
  name = 'Init1703017999243';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "resources"."category" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" SERIAL NOT NULL, "name" text NOT NULL, "description" text, CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name"), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "auth"."session" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "access_token" text NOT NULL, "refresh_token" text NOT NULL, "expired_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ip" inet NOT NULL, "user_agent" text, "user_id" uuid, CONSTRAINT "UQ_dd3bfba3a86f80dc44b1834cdf5" UNIQUE ("access_token"), CONSTRAINT "UQ_14f5d9fd42ee29c579807b5f7e5" UNIQUE ("refresh_token"), CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users"."role" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" SERIAL NOT NULL, "name" text NOT NULL, "description" text, CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name"), CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "resources"."cg_soft" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" SERIAL NOT NULL, "name" text NOT NULL, "description" text, CONSTRAINT "UQ_0ca26b9a56ca5a514bb7c448fcd" UNIQUE ("name"), CONSTRAINT "PK_d8a8f129ba042563e3428f2fac8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users"."user_meta" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "about_yourself" text, "avatar" text, CONSTRAINT "PK_2b45acc20c0a71d613f9ed6d9e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users"."user" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "last_login_date" TIMESTAMP WITH TIME ZONE, "email" text NOT NULL, "phone" text, "password" text NOT NULL, "salt" text NOT NULL, "first_name" text, "middle_name" text, "last_name" text, "is_confirmed" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "user_meta_id" uuid NOT NULL, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_8e1f623798118e629b46a9e6299" UNIQUE ("phone"), CONSTRAINT "REL_ec03dddce46b4c14e25b70f9dc" UNIQUE ("user_meta_id"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "model_3d"."model_3d" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "file" text NOT NULL, "description" json, "thumbnail" text, "user_id" uuid, CONSTRAINT "PK_0a8f9a5541a87cb34a25c573954" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users"."user_reset_password" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expired_at" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "REL_2a819c1c57be41646da4cb1faf" UNIQUE ("user_id"), CONSTRAINT "PK_7375b15001ebb80cac091ea3589" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users"."user_meta_cg_soft" ("user_meta_id" uuid NOT NULL, "cg_soft_id" integer NOT NULL, CONSTRAINT "PK_b66f0362c7003f153e79e99676a" PRIMARY KEY ("user_meta_id", "cg_soft_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e26f5c00edf8c0a570732d6a69" ON "users"."user_meta_cg_soft" ("user_meta_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2e055ed72bfe03d34fa8eb23a0" ON "users"."user_meta_cg_soft" ("cg_soft_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users"."user_role" ("user_id" uuid NOT NULL, "role_id" integer NOT NULL, CONSTRAINT "PK_f634684acb47c1a158b83af5150" PRIMARY KEY ("user_id", "role_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_d0e5815877f7395a198a4cb0a4" ON "users"."user_role" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_32a6fc2fcb019d8e3a8ace0f55" ON "users"."user_role" ("role_id") `);
    await queryRunner.query(
      `CREATE TABLE "model_3d"."model_3d_categories" ("model_3d_id" uuid NOT NULL, "category_id" integer NOT NULL, CONSTRAINT "PK_8ecafaea37f366c5b73414fb718" PRIMARY KEY ("model_3d_id", "category_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eb62019e82da18898db7290bc6" ON "model_3d"."model_3d_categories" ("model_3d_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_02d2a7e81b69e1b013b614104a" ON "model_3d"."model_3d_categories" ("category_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "auth"."session" ADD CONSTRAINT "FK_30e98e8746699fb9af235410aff" FOREIGN KEY ("user_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user" ADD CONSTRAINT "FK_ec03dddce46b4c14e25b70f9dc8" FOREIGN KEY ("user_meta_id") REFERENCES "users"."user_meta"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_3d" ADD CONSTRAINT "FK_71a156a3f48b3e6dc3b58d0ccf6" FOREIGN KEY ("user_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user_reset_password" ADD CONSTRAINT "FK_2a819c1c57be41646da4cb1fafa" FOREIGN KEY ("user_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user_meta_cg_soft" ADD CONSTRAINT "FK_e26f5c00edf8c0a570732d6a692" FOREIGN KEY ("user_meta_id") REFERENCES "users"."user_meta"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user_meta_cg_soft" ADD CONSTRAINT "FK_2e055ed72bfe03d34fa8eb23a0b" FOREIGN KEY ("cg_soft_id") REFERENCES "resources"."cg_soft"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user_role" ADD CONSTRAINT "FK_d0e5815877f7395a198a4cb0a46" FOREIGN KEY ("user_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user_role" ADD CONSTRAINT "FK_32a6fc2fcb019d8e3a8ace0f55f" FOREIGN KEY ("role_id") REFERENCES "users"."role"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_3d_categories" ADD CONSTRAINT "FK_eb62019e82da18898db7290bc60" FOREIGN KEY ("model_3d_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_3d_categories" ADD CONSTRAINT "FK_02d2a7e81b69e1b013b614104a0" FOREIGN KEY ("category_id") REFERENCES "resources"."category"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_3d_categories" DROP CONSTRAINT "FK_02d2a7e81b69e1b013b614104a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_3d_categories" DROP CONSTRAINT "FK_eb62019e82da18898db7290bc60"`,
    );
    await queryRunner.query(`ALTER TABLE "users"."user_role" DROP CONSTRAINT "FK_32a6fc2fcb019d8e3a8ace0f55f"`);
    await queryRunner.query(`ALTER TABLE "users"."user_role" DROP CONSTRAINT "FK_d0e5815877f7395a198a4cb0a46"`);
    await queryRunner.query(`ALTER TABLE "users"."user_meta_cg_soft" DROP CONSTRAINT "FK_2e055ed72bfe03d34fa8eb23a0b"`);
    await queryRunner.query(`ALTER TABLE "users"."user_meta_cg_soft" DROP CONSTRAINT "FK_e26f5c00edf8c0a570732d6a692"`);
    await queryRunner.query(
      `ALTER TABLE "users"."user_reset_password" DROP CONSTRAINT "FK_2a819c1c57be41646da4cb1fafa"`,
    );
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d" DROP CONSTRAINT "FK_71a156a3f48b3e6dc3b58d0ccf6"`);
    await queryRunner.query(`ALTER TABLE "users"."user" DROP CONSTRAINT "FK_ec03dddce46b4c14e25b70f9dc8"`);
    await queryRunner.query(`ALTER TABLE "auth"."session" DROP CONSTRAINT "FK_30e98e8746699fb9af235410aff"`);
    await queryRunner.query(`DROP INDEX "model_3d"."IDX_02d2a7e81b69e1b013b614104a"`);
    await queryRunner.query(`DROP INDEX "model_3d"."IDX_eb62019e82da18898db7290bc6"`);
    await queryRunner.query(`DROP TABLE "model_3d"."model_3d_categories"`);
    await queryRunner.query(`DROP INDEX "users"."IDX_32a6fc2fcb019d8e3a8ace0f55"`);
    await queryRunner.query(`DROP INDEX "users"."IDX_d0e5815877f7395a198a4cb0a4"`);
    await queryRunner.query(`DROP TABLE "users"."user_role"`);
    await queryRunner.query(`DROP INDEX "users"."IDX_2e055ed72bfe03d34fa8eb23a0"`);
    await queryRunner.query(`DROP INDEX "users"."IDX_e26f5c00edf8c0a570732d6a69"`);
    await queryRunner.query(`DROP TABLE "users"."user_meta_cg_soft"`);
    await queryRunner.query(`DROP TABLE "users"."user_reset_password"`);
    await queryRunner.query(`DROP TABLE "model_3d"."model_3d"`);
    await queryRunner.query(`DROP TABLE "users"."user"`);
    await queryRunner.query(`DROP TABLE "users"."user_meta"`);
    await queryRunner.query(`DROP TABLE "resources"."cg_soft"`);
    await queryRunner.query(`DROP TABLE "users"."role"`);
    await queryRunner.query(`DROP TABLE "auth"."session"`);
    await queryRunner.query(`DROP TABLE "resources"."category"`);
  }
}
