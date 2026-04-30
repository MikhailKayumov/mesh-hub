import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1777486474931 implements MigrationInterface {
  name = 'Init1777486474931';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "organizations"."organization_plan_type_enum" AS ENUM('starter', 'growth', 'enterprise')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations"."organization" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "slug" text NOT NULL, "plan_type" "organizations"."organization_plan_type_enum" NOT NULL DEFAULT 'starter', CONSTRAINT "UQ_a08804baa7c5d5427067c49a31f" UNIQUE ("slug"), CONSTRAINT "PK_472c1f99a32def1b0abb219cd67" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workspaces"."workspace" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "org_id" uuid NOT NULL, CONSTRAINT "PK_ca86b6f9b3be5fe26d307d09b49" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "model_3d"."model_3d_file" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "size" bigint NOT NULL, "extension" text NOT NULL, "entry_file" text, "original_format" character varying(10) NOT NULL DEFAULT 'glb', CONSTRAINT "PK_57b840bb4c53dd66a6042b0dcaa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "model_3d"."model_version" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version_number" integer NOT NULL DEFAULT '1', "file_name" text NOT NULL, "file_size" bigint NOT NULL, "mime_type" text NOT NULL, "entry_file" text, "change_notes" character varying(500), "is_active" boolean NOT NULL DEFAULT false, "model_id" uuid NOT NULL, "uploader_id" uuid NOT NULL, CONSTRAINT "PK_1213bca4e8ee7ac1323cc4bf454" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_959afe36ff1a069b7cfbdb65ec" ON "model_3d"."model_version" ("model_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "resources"."category" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" SERIAL NOT NULL, "name" text NOT NULL, "description" text, CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name"), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TYPE "model_3d"."model_visibility" AS ENUM('public', 'private', 'unlisted')`);
    await queryRunner.query(
      `CREATE TABLE "model_3d"."model_3d" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" json, "thumbnail" text, "visibility" "model_3d"."model_visibility" NOT NULL DEFAULT 'public', "workspace_id" uuid, "current_version_id" uuid, "user_id" uuid, "file_id" uuid NOT NULL, CONSTRAINT "REL_57b840bb4c53dd66a6042b0dca" UNIQUE ("file_id"), CONSTRAINT "PK_0a8f9a5541a87cb34a25c573954" PRIMARY KEY ("id"))`,
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
    await queryRunner.query(`CREATE TYPE "workspaces"."workspace_member_role_enum" AS ENUM('editor', 'viewer')`);
    await queryRunner.query(
      `CREATE TABLE "workspaces"."workspace_member" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "workspaces"."workspace_member_role_enum" NOT NULL, "workspace_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "UQ_0eab76d5a9c509930a9f3d7a104" UNIQUE ("workspace_id", "user_id"), CONSTRAINT "PK_a3a35f64bf30517010551467c6e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users"."user_reset_password" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expired_at" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "REL_2a819c1c57be41646da4cb1faf" UNIQUE ("user_id"), CONSTRAINT "PK_7375b15001ebb80cac091ea3589" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TYPE "scenes"."scene_light_type_enum" AS ENUM('directional', 'point', 'spot')`);
    await queryRunner.query(
      `CREATE TABLE "scenes"."scene_light" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "scenes"."scene_light_type_enum" NOT NULL, "pos_x" double precision NOT NULL DEFAULT '0', "pos_y" double precision NOT NULL DEFAULT '0', "pos_z" double precision NOT NULL DEFAULT '0', "color" character varying(7) NOT NULL DEFAULT '#ffffff', "intensity" double precision NOT NULL DEFAULT '1', "cast_shadow" boolean NOT NULL DEFAULT true, "scene_id" uuid NOT NULL, CONSTRAINT "PK_173667a9cb02719804d95ce7cba" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "scenes"."scene_object" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pos_x" double precision NOT NULL DEFAULT '0', "pos_y" double precision NOT NULL DEFAULT '0', "pos_z" double precision NOT NULL DEFAULT '0', "rot_x" double precision NOT NULL DEFAULT '0', "rot_y" double precision NOT NULL DEFAULT '0', "rot_z" double precision NOT NULL DEFAULT '0', "scale_x" double precision NOT NULL DEFAULT '1', "scale_y" double precision NOT NULL DEFAULT '1', "scale_z" double precision NOT NULL DEFAULT '1', "order" integer NOT NULL DEFAULT '0', "scene_id" uuid NOT NULL, "model_id" uuid NOT NULL, "animation_config" jsonb, "audio_config" jsonb, CONSTRAINT "PK_64a8d352e73f7323d3b240da116" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_c8291dae9f58ca1d1f50dc2842" ON "scenes"."scene_object" ("scene_id") `);
    await queryRunner.query(`CREATE TYPE "scenes"."scene_visibility_enum" AS ENUM('public', 'private', 'unlisted')`);
    await queryRunner.query(
      `CREATE TABLE "scenes"."scene" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "config" jsonb, "thumbnail_path" text, "workspace_id" uuid, "user_id" uuid, "visibility" "scenes"."scene_visibility_enum" NOT NULL DEFAULT 'private', CONSTRAINT "CHK_scene_owner" CHECK ("user_id" IS NOT NULL OR "workspace_id" IS NOT NULL), CONSTRAINT "PK_680b182e0d3bd68553f944295f4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "scenes"."scene_comment" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "scene_id" uuid NOT NULL, "author_id" uuid NOT NULL, "parent_id" uuid, "body" text NOT NULL, "resolved" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_7fec7d7322fb368f40d6c7ff46a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_6fb63573b348c0d599da9de6c8" ON "scenes"."scene_comment" ("parent_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_cd0c4903677148e4c659866d3f" ON "scenes"."scene_comment" ("scene_id") `);
    await queryRunner.query(
      `CREATE TABLE "scenes"."scene_annotation" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "scene_id" uuid NOT NULL, "scene_object_id" uuid, "user_id" uuid NOT NULL, "label" character varying(120) NOT NULL, "body" text, "pos_x" double precision NOT NULL, "pos_y" double precision NOT NULL, "pos_z" double precision NOT NULL, "camera_pos_x" double precision, "camera_pos_y" double precision, "camera_pos_z" double precision, "order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_71b2574c53568b63f43d276fb68" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_25dc129326c6f5742142cab1fd" ON "scenes"."scene_annotation" ("scene_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations"."webhook" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "org_id" uuid NOT NULL, "url" text NOT NULL, "events" text array NOT NULL, "secret" character varying(255) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_e6765510c2d078db49632b59020" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_e5b373ad53378b074b96c3eec6" ON "organizations"."webhook" ("org_id") `);
    await queryRunner.query(
      `CREATE TABLE "organizations"."webhook_delivery_log" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "webhook_id" uuid NOT NULL, "event" character varying(50) NOT NULL, "payload" jsonb NOT NULL, "response_status" integer, "delivered_at" TIMESTAMP WITH TIME ZONE, "failed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_23b6a6709d0e64906e63daaf871" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d9b51bb680364bb6f3eb517986" ON "organizations"."webhook_delivery_log" ("webhook_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "organizations"."org_subscription_storage_backend_enum" AS ENUM('local', 's3')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations"."org_subscription" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "storage_limit_bytes" bigint, "seats_limit" integer, "storage_backend" "organizations"."org_subscription_storage_backend_enum" NOT NULL DEFAULT 'local', "storage_config_encrypted" text, "org_id" uuid NOT NULL, CONSTRAINT "UQ_e8a787b7bfb98c3362ea2828db5" UNIQUE ("org_id"), CONSTRAINT "REL_e8a787b7bfb98c3362ea2828db" UNIQUE ("org_id"), CONSTRAINT "PK_1c0781ca76405e0459b38ed0fb2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "organizations"."org_member_role_enum" AS ENUM('owner', 'admin', 'editor', 'viewer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations"."org_member" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "organizations"."org_member_role_enum" NOT NULL, "org_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "UQ_3887c571683d00674628d8bf2f0" UNIQUE ("org_id", "user_id"), CONSTRAINT "PK_572a1b79344c45cba61e93eb34c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "organizations"."org_invite_role_enum" AS ENUM('owner', 'admin', 'editor', 'viewer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations"."org_invite" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invited_email" text NOT NULL, "role" "organizations"."org_invite_role_enum" NOT NULL, "token" uuid NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "accepted_at" TIMESTAMP WITH TIME ZONE, "org_id" uuid NOT NULL, CONSTRAINT "UQ_21615b6463fa207d016486ba8e1" UNIQUE ("token"), CONSTRAINT "PK_e85cea7f4d8925abbe2498e93b1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications"."notification" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" character varying(50) NOT NULL, "payload" jsonb NOT NULL, "is_read" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_af4870a2f8b5443a1fe1aecd4c" ON "notifications"."notification" ("user_id", "is_read") `,
    );
    await queryRunner.query(
      `CREATE TABLE "model_3d"."model_material_override" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "model_id" uuid NOT NULL, "mesh_name" character varying(255) NOT NULL, "color_hex" character varying(9), "metalness" double precision, "roughness" double precision, "emissive_hex" character varying(9), "emissive_intensity" double precision, "opacity" double precision, "wireframe" boolean NOT NULL DEFAULT false, "texture_map_path" text, "normal_map_path" text, "roughness_map_path" text, "metalness_map_path" text, "emissive_map_path" text, "ao_map_path" text, CONSTRAINT "PK_db51ab195b649a71096e99add91" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d99643860e4dd6c7090aba0b87" ON "model_3d"."model_material_override" ("model_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "model_3d"."model_light" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "model_id" uuid NOT NULL, "type" character varying(15) NOT NULL, "pos_x" double precision NOT NULL DEFAULT '0', "pos_y" double precision NOT NULL DEFAULT '5', "pos_z" double precision NOT NULL DEFAULT '5', "color" character varying(9) NOT NULL DEFAULT '#ffffff', "intensity" double precision NOT NULL DEFAULT '1', "cast_shadow" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_986c44711324b2ce3f1fe41ab65" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_477f95ecfbb245c3d37bb498b7" ON "model_3d"."model_light" ("model_id") `);
    await queryRunner.query(
      `CREATE TABLE "model_3d"."model_display_config" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "model_id" uuid NOT NULL, "background_color" character varying(9) NOT NULL DEFAULT '#000000', "ambient_intensity" double precision NOT NULL DEFAULT '0.5', "environment_hdri_path" text, "fog_enabled" boolean NOT NULL DEFAULT false, "fog_type" character varying(10) NOT NULL DEFAULT 'linear', "fog_color" character varying(9) NOT NULL DEFAULT '#cccccc', "fog_near" double precision NOT NULL DEFAULT '10', "fog_far" double precision NOT NULL DEFAULT '100', "post_process" jsonb, "renderer_config" jsonb, CONSTRAINT "UQ_97c3e775965379d55578ae18532" UNIQUE ("model_id"), CONSTRAINT "REL_97c3e775965379d55578ae1853" UNIQUE ("model_id"), CONSTRAINT "PK_e72adf6f3a3b26736ad3616347d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "model_3d"."model_comment" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "body" text NOT NULL, "pos_x" double precision, "pos_y" double precision, "pos_z" double precision, "resolved" boolean NOT NULL DEFAULT false, "model_id" uuid NOT NULL, "author_id" uuid NOT NULL, "parent_id" uuid, CONSTRAINT "PK_6c651588b69449016f1b8fb3a8d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c2f04c5890af6074b7a067a4bb" ON "model_3d"."model_comment" ("model_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "model_3d"."model_audio" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "model_id" uuid NOT NULL, "filename" character varying(255) NOT NULL, "original_name" character varying(255) NOT NULL, "duration_s" double precision, CONSTRAINT "PK_52634cf6ff273d3e68a1768bc67" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_3ce76f692aff8ff3694be52292" ON "model_3d"."model_audio" ("model_id") `);
    await queryRunner.query(
      `CREATE TABLE "model_3d"."model_annotation" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "label" character varying(50) NOT NULL, "body" text, "pos_x" double precision NOT NULL, "pos_y" double precision NOT NULL, "pos_z" double precision NOT NULL, "camera_pos_x" double precision, "camera_pos_y" double precision, "camera_pos_z" double precision, "order" integer NOT NULL DEFAULT '0', "model_id" uuid NOT NULL, CONSTRAINT "PK_9e6eae794e10e54d7368c87b72a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b80aceefc003bd2f83134a52e3" ON "model_3d"."model_annotation" ("model_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "embed"."embed_domain_whitelist" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" SERIAL NOT NULL, "domain" text NOT NULL, "embed_project_id" uuid NOT NULL, CONSTRAINT "PK_372ae5d0d98f9ff3fab282e1dda" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_229c0ba88bd06b24680ac463cd" ON "embed"."embed_domain_whitelist" ("embed_project_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "embed"."embed_project" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "branding_config" json, "auto_rotate" boolean NOT NULL DEFAULT false, "org_id" uuid NOT NULL, "model_id" uuid, "scene_id" uuid, CONSTRAINT "embed_project_target_check" CHECK (num_nonnulls("model_id", "scene_id") = 1), CONSTRAINT "PK_51cb4f17484f893cc10ae9a2a8d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "embed"."model_view_log" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" SERIAL NOT NULL, "origin" text, "duration_seconds" integer, "model_id" uuid NOT NULL, "embed_project_id" uuid, CONSTRAINT "PK_0de48931199eba172611359bafa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "embed"."api_key" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "prefix" character varying(8) NOT NULL, "key_hash" text NOT NULL, "last_used_at" TIMESTAMP WITH TIME ZONE, "expires_at" TIMESTAMP WITH TIME ZONE, "revoked_at" TIMESTAMP WITH TIME ZONE, "scopes" text array NOT NULL DEFAULT '{embed:read}', "org_id" uuid NOT NULL, CONSTRAINT "PK_b1bd840641b8acbaad89c3d8d11" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c4f6ccad30c0862eb54af9fb0a" ON "embed"."api_key" ("prefix") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3c9751d2a6011ba13e27838105" ON "embed"."api_key" ("key_hash") `);
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
    // FK indices added in audit follow-up — Postgres does not auto-index FK columns,
    // so 1:many relations need explicit indices to keep joins/lookups fast.
    await queryRunner.query(`CREATE INDEX "IDX_session_user_id" ON "auth"."session" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_model_3d_user_id" ON "model_3d"."model_3d" ("user_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_model_version_uploader_id" ON "model_3d"."model_version" ("uploader_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_workspace_member_user_id" ON "workspaces"."workspace_member" ("user_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_org_member_user_id" ON "organizations"."org_member" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_org_invite_org_id" ON "organizations"."org_invite" ("org_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_scene_workspace_id" ON "scenes"."scene" ("workspace_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_scene_user_id" ON "scenes"."scene" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_scene_object_model_id" ON "scenes"."scene_object" ("model_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_scene_light_scene_id" ON "scenes"."scene_light" ("scene_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_scene_comment_author_id" ON "scenes"."scene_comment" ("author_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_scene_annotation_scene_object_id" ON "scenes"."scene_annotation" ("scene_object_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_scene_annotation_user_id" ON "scenes"."scene_annotation" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_embed_project_org_id" ON "embed"."embed_project" ("org_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_embed_project_model_id" ON "embed"."embed_project" ("model_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_embed_project_scene_id" ON "embed"."embed_project" ("scene_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_model_view_log_model_id" ON "embed"."model_view_log" ("model_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_model_view_log_embed_project_id" ON "embed"."model_view_log" ("embed_project_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_api_key_org_id" ON "embed"."api_key" ("org_id") `);
    await queryRunner.query(
      `ALTER TABLE "workspaces"."workspace" ADD CONSTRAINT "FK_a5498b79ec16741b57e976105ee" FOREIGN KEY ("org_id") REFERENCES "organizations"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_version" ADD CONSTRAINT "FK_959afe36ff1a069b7cfbdb65ece" FOREIGN KEY ("model_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_version" ADD CONSTRAINT "FK_262706db9a3456e6c1e36613da8" FOREIGN KEY ("uploader_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_3d" ADD CONSTRAINT "FK_71a156a3f48b3e6dc3b58d0ccf6" FOREIGN KEY ("user_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_3d" ADD CONSTRAINT "FK_57b840bb4c53dd66a6042b0dcaa" FOREIGN KEY ("file_id") REFERENCES "model_3d"."model_3d_file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth"."session" ADD CONSTRAINT "FK_30e98e8746699fb9af235410aff" FOREIGN KEY ("user_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user" ADD CONSTRAINT "FK_ec03dddce46b4c14e25b70f9dc8" FOREIGN KEY ("user_meta_id") REFERENCES "users"."user_meta"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces"."workspace_member" ADD CONSTRAINT "FK_73d466cb93234025fe379fa5873" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces"."workspace_member" ADD CONSTRAINT "FK_82b74268d8b7e1574fd744b3903" FOREIGN KEY ("user_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users"."user_reset_password" ADD CONSTRAINT "FK_2a819c1c57be41646da4cb1fafa" FOREIGN KEY ("user_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenes"."scene_light" ADD CONSTRAINT "FK_9d551ebf3cdde6485ff1cea5b1a" FOREIGN KEY ("scene_id") REFERENCES "scenes"."scene"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenes"."scene_object" ADD CONSTRAINT "FK_c8291dae9f58ca1d1f50dc28422" FOREIGN KEY ("scene_id") REFERENCES "scenes"."scene"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenes"."scene_object" ADD CONSTRAINT "FK_094faeef5c8051a9a8fe93ac4f5" FOREIGN KEY ("model_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenes"."scene" ADD CONSTRAINT "FK_4d1d79846343e17814d63c7cb5d" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenes"."scene" ADD CONSTRAINT "FK_5f17601a9c32c877bfda1b39dec" FOREIGN KEY ("user_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenes"."scene_comment" ADD CONSTRAINT "FK_cd0c4903677148e4c659866d3fe" FOREIGN KEY ("scene_id") REFERENCES "scenes"."scene"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenes"."scene_comment" ADD CONSTRAINT "FK_04658deb7ac111e74e5b3953c63" FOREIGN KEY ("author_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenes"."scene_comment" ADD CONSTRAINT "FK_6fb63573b348c0d599da9de6c8a" FOREIGN KEY ("parent_id") REFERENCES "scenes"."scene_comment"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenes"."scene_annotation" ADD CONSTRAINT "FK_25dc129326c6f5742142cab1fd3" FOREIGN KEY ("scene_id") REFERENCES "scenes"."scene"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenes"."scene_annotation" ADD CONSTRAINT "FK_97598f4140723988f7da901bd37" FOREIGN KEY ("scene_object_id") REFERENCES "scenes"."scene_object"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenes"."scene_annotation" ADD CONSTRAINT "FK_4951cf5c168bc47d4cfdbe7fb6a" FOREIGN KEY ("user_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."webhook" ADD CONSTRAINT "FK_e5b373ad53378b074b96c3eec66" FOREIGN KEY ("org_id") REFERENCES "organizations"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."webhook_delivery_log" ADD CONSTRAINT "FK_d9b51bb680364bb6f3eb5179865" FOREIGN KEY ("webhook_id") REFERENCES "organizations"."webhook"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."org_subscription" ADD CONSTRAINT "FK_e8a787b7bfb98c3362ea2828db5" FOREIGN KEY ("org_id") REFERENCES "organizations"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."org_member" ADD CONSTRAINT "FK_5cbc4503718aea4e7b545b63e6f" FOREIGN KEY ("org_id") REFERENCES "organizations"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."org_member" ADD CONSTRAINT "FK_167aa0aeb690d602164c1626acb" FOREIGN KEY ("user_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."org_invite" ADD CONSTRAINT "FK_e6b32476348fdee37b11c54bd33" FOREIGN KEY ("org_id") REFERENCES "organizations"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications"."notification" ADD CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8" FOREIGN KEY ("user_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_material_override" ADD CONSTRAINT "FK_d99643860e4dd6c7090aba0b872" FOREIGN KEY ("model_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_light" ADD CONSTRAINT "FK_477f95ecfbb245c3d37bb498b7d" FOREIGN KEY ("model_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_display_config" ADD CONSTRAINT "FK_97c3e775965379d55578ae18532" FOREIGN KEY ("model_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_comment" ADD CONSTRAINT "FK_c2f04c5890af6074b7a067a4bbf" FOREIGN KEY ("model_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_comment" ADD CONSTRAINT "FK_cdf36a19c10552a0525651d0f1b" FOREIGN KEY ("author_id") REFERENCES "users"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_comment" ADD CONSTRAINT "FK_0c9f36846dc880eb102bfb5f62e" FOREIGN KEY ("parent_id") REFERENCES "model_3d"."model_comment"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_audio" ADD CONSTRAINT "FK_3ce76f692aff8ff3694be52292a" FOREIGN KEY ("model_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_annotation" ADD CONSTRAINT "FK_b80aceefc003bd2f83134a52e33" FOREIGN KEY ("model_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "embed"."embed_domain_whitelist" ADD CONSTRAINT "FK_229c0ba88bd06b24680ac463cdf" FOREIGN KEY ("embed_project_id") REFERENCES "embed"."embed_project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "embed"."embed_project" ADD CONSTRAINT "FK_82703f98b7b161931a9981539f5" FOREIGN KEY ("org_id") REFERENCES "organizations"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "embed"."embed_project" ADD CONSTRAINT "FK_ec90a72e66d1f0b2578e48542ea" FOREIGN KEY ("model_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "embed"."embed_project" ADD CONSTRAINT "FK_56f60d1a325b24299e74e61bab6" FOREIGN KEY ("scene_id") REFERENCES "scenes"."scene"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "embed"."model_view_log" ADD CONSTRAINT "FK_6f7238ceb5d5419a8e2d9dbf656" FOREIGN KEY ("model_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "embed"."model_view_log" ADD CONSTRAINT "FK_20193d9b169e9b4549b5fd17955" FOREIGN KEY ("embed_project_id") REFERENCES "embed"."embed_project"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "embed"."api_key" ADD CONSTRAINT "FK_80f6e510b9dbf92323d35e4c5d1" FOREIGN KEY ("org_id") REFERENCES "organizations"."organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_3d_categories" ADD CONSTRAINT "FK_eb62019e82da18898db7290bc60" FOREIGN KEY ("model_3d_id") REFERENCES "model_3d"."model_3d"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_3d_categories" ADD CONSTRAINT "FK_02d2a7e81b69e1b013b614104a0" FOREIGN KEY ("category_id") REFERENCES "resources"."category"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users"."user_role" DROP CONSTRAINT "FK_32a6fc2fcb019d8e3a8ace0f55f"`);
    await queryRunner.query(`ALTER TABLE "users"."user_role" DROP CONSTRAINT "FK_d0e5815877f7395a198a4cb0a46"`);
    await queryRunner.query(`ALTER TABLE "users"."user_meta_cg_soft" DROP CONSTRAINT "FK_2e055ed72bfe03d34fa8eb23a0b"`);
    await queryRunner.query(`ALTER TABLE "users"."user_meta_cg_soft" DROP CONSTRAINT "FK_e26f5c00edf8c0a570732d6a692"`);
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_3d_categories" DROP CONSTRAINT "FK_02d2a7e81b69e1b013b614104a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_3d_categories" DROP CONSTRAINT "FK_eb62019e82da18898db7290bc60"`,
    );
    await queryRunner.query(`ALTER TABLE "embed"."api_key" DROP CONSTRAINT "FK_80f6e510b9dbf92323d35e4c5d1"`);
    await queryRunner.query(`ALTER TABLE "embed"."model_view_log" DROP CONSTRAINT "FK_20193d9b169e9b4549b5fd17955"`);
    await queryRunner.query(`ALTER TABLE "embed"."model_view_log" DROP CONSTRAINT "FK_6f7238ceb5d5419a8e2d9dbf656"`);
    await queryRunner.query(`ALTER TABLE "embed"."embed_project" DROP CONSTRAINT "FK_56f60d1a325b24299e74e61bab6"`);
    await queryRunner.query(`ALTER TABLE "embed"."embed_project" DROP CONSTRAINT "FK_ec90a72e66d1f0b2578e48542ea"`);
    await queryRunner.query(`ALTER TABLE "embed"."embed_project" DROP CONSTRAINT "FK_82703f98b7b161931a9981539f5"`);
    await queryRunner.query(
      `ALTER TABLE "embed"."embed_domain_whitelist" DROP CONSTRAINT "FK_229c0ba88bd06b24680ac463cdf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_annotation" DROP CONSTRAINT "FK_b80aceefc003bd2f83134a52e33"`,
    );
    await queryRunner.query(`ALTER TABLE "model_3d"."model_audio" DROP CONSTRAINT "FK_3ce76f692aff8ff3694be52292a"`);
    await queryRunner.query(`ALTER TABLE "model_3d"."model_comment" DROP CONSTRAINT "FK_0c9f36846dc880eb102bfb5f62e"`);
    await queryRunner.query(`ALTER TABLE "model_3d"."model_comment" DROP CONSTRAINT "FK_cdf36a19c10552a0525651d0f1b"`);
    await queryRunner.query(`ALTER TABLE "model_3d"."model_comment" DROP CONSTRAINT "FK_c2f04c5890af6074b7a067a4bbf"`);
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_display_config" DROP CONSTRAINT "FK_97c3e775965379d55578ae18532"`,
    );
    await queryRunner.query(`ALTER TABLE "model_3d"."model_light" DROP CONSTRAINT "FK_477f95ecfbb245c3d37bb498b7d"`);
    await queryRunner.query(
      `ALTER TABLE "model_3d"."model_material_override" DROP CONSTRAINT "FK_d99643860e4dd6c7090aba0b872"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications"."notification" DROP CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."org_invite" DROP CONSTRAINT "FK_e6b32476348fdee37b11c54bd33"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."org_member" DROP CONSTRAINT "FK_167aa0aeb690d602164c1626acb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."org_member" DROP CONSTRAINT "FK_5cbc4503718aea4e7b545b63e6f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."org_subscription" DROP CONSTRAINT "FK_e8a787b7bfb98c3362ea2828db5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations"."webhook_delivery_log" DROP CONSTRAINT "FK_d9b51bb680364bb6f3eb5179865"`,
    );
    await queryRunner.query(`ALTER TABLE "organizations"."webhook" DROP CONSTRAINT "FK_e5b373ad53378b074b96c3eec66"`);
    await queryRunner.query(`ALTER TABLE "scenes"."scene_annotation" DROP CONSTRAINT "FK_4951cf5c168bc47d4cfdbe7fb6a"`);
    await queryRunner.query(`ALTER TABLE "scenes"."scene_annotation" DROP CONSTRAINT "FK_97598f4140723988f7da901bd37"`);
    await queryRunner.query(`ALTER TABLE "scenes"."scene_annotation" DROP CONSTRAINT "FK_25dc129326c6f5742142cab1fd3"`);
    await queryRunner.query(`ALTER TABLE "scenes"."scene_comment" DROP CONSTRAINT "FK_6fb63573b348c0d599da9de6c8a"`);
    await queryRunner.query(`ALTER TABLE "scenes"."scene_comment" DROP CONSTRAINT "FK_04658deb7ac111e74e5b3953c63"`);
    await queryRunner.query(`ALTER TABLE "scenes"."scene_comment" DROP CONSTRAINT "FK_cd0c4903677148e4c659866d3fe"`);
    await queryRunner.query(`ALTER TABLE "scenes"."scene" DROP CONSTRAINT "FK_5f17601a9c32c877bfda1b39dec"`);
    await queryRunner.query(`ALTER TABLE "scenes"."scene" DROP CONSTRAINT "FK_4d1d79846343e17814d63c7cb5d"`);
    await queryRunner.query(`ALTER TABLE "scenes"."scene_object" DROP CONSTRAINT "FK_094faeef5c8051a9a8fe93ac4f5"`);
    await queryRunner.query(`ALTER TABLE "scenes"."scene_object" DROP CONSTRAINT "FK_c8291dae9f58ca1d1f50dc28422"`);
    await queryRunner.query(`ALTER TABLE "scenes"."scene_light" DROP CONSTRAINT "FK_9d551ebf3cdde6485ff1cea5b1a"`);
    await queryRunner.query(
      `ALTER TABLE "users"."user_reset_password" DROP CONSTRAINT "FK_2a819c1c57be41646da4cb1fafa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces"."workspace_member" DROP CONSTRAINT "FK_82b74268d8b7e1574fd744b3903"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces"."workspace_member" DROP CONSTRAINT "FK_73d466cb93234025fe379fa5873"`,
    );
    await queryRunner.query(`ALTER TABLE "users"."user" DROP CONSTRAINT "FK_ec03dddce46b4c14e25b70f9dc8"`);
    await queryRunner.query(`ALTER TABLE "auth"."session" DROP CONSTRAINT "FK_30e98e8746699fb9af235410aff"`);
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d" DROP CONSTRAINT "FK_57b840bb4c53dd66a6042b0dcaa"`);
    await queryRunner.query(`ALTER TABLE "model_3d"."model_3d" DROP CONSTRAINT "FK_71a156a3f48b3e6dc3b58d0ccf6"`);
    await queryRunner.query(`ALTER TABLE "model_3d"."model_version" DROP CONSTRAINT "FK_262706db9a3456e6c1e36613da8"`);
    await queryRunner.query(`ALTER TABLE "model_3d"."model_version" DROP CONSTRAINT "FK_959afe36ff1a069b7cfbdb65ece"`);
    await queryRunner.query(`ALTER TABLE "workspaces"."workspace" DROP CONSTRAINT "FK_a5498b79ec16741b57e976105ee"`);
    await queryRunner.query(`DROP INDEX "embed"."IDX_api_key_org_id"`);
    await queryRunner.query(`DROP INDEX "embed"."IDX_model_view_log_embed_project_id"`);
    await queryRunner.query(`DROP INDEX "embed"."IDX_model_view_log_model_id"`);
    await queryRunner.query(`DROP INDEX "embed"."IDX_embed_project_scene_id"`);
    await queryRunner.query(`DROP INDEX "embed"."IDX_embed_project_model_id"`);
    await queryRunner.query(`DROP INDEX "embed"."IDX_embed_project_org_id"`);
    await queryRunner.query(`DROP INDEX "scenes"."IDX_scene_annotation_user_id"`);
    await queryRunner.query(`DROP INDEX "scenes"."IDX_scene_annotation_scene_object_id"`);
    await queryRunner.query(`DROP INDEX "scenes"."IDX_scene_comment_author_id"`);
    await queryRunner.query(`DROP INDEX "scenes"."IDX_scene_light_scene_id"`);
    await queryRunner.query(`DROP INDEX "scenes"."IDX_scene_object_model_id"`);
    await queryRunner.query(`DROP INDEX "scenes"."IDX_scene_user_id"`);
    await queryRunner.query(`DROP INDEX "scenes"."IDX_scene_workspace_id"`);
    await queryRunner.query(`DROP INDEX "organizations"."IDX_org_invite_org_id"`);
    await queryRunner.query(`DROP INDEX "organizations"."IDX_org_member_user_id"`);
    await queryRunner.query(`DROP INDEX "workspaces"."IDX_workspace_member_user_id"`);
    await queryRunner.query(`DROP INDEX "model_3d"."IDX_model_version_uploader_id"`);
    await queryRunner.query(`DROP INDEX "model_3d"."IDX_model_3d_user_id"`);
    await queryRunner.query(`DROP INDEX "auth"."IDX_session_user_id"`);
    await queryRunner.query(`DROP INDEX "users"."IDX_32a6fc2fcb019d8e3a8ace0f55"`);
    await queryRunner.query(`DROP INDEX "users"."IDX_d0e5815877f7395a198a4cb0a4"`);
    await queryRunner.query(`DROP TABLE "users"."user_role"`);
    await queryRunner.query(`DROP INDEX "users"."IDX_2e055ed72bfe03d34fa8eb23a0"`);
    await queryRunner.query(`DROP INDEX "users"."IDX_e26f5c00edf8c0a570732d6a69"`);
    await queryRunner.query(`DROP TABLE "users"."user_meta_cg_soft"`);
    await queryRunner.query(`DROP INDEX "model_3d"."IDX_02d2a7e81b69e1b013b614104a"`);
    await queryRunner.query(`DROP INDEX "model_3d"."IDX_eb62019e82da18898db7290bc6"`);
    await queryRunner.query(`DROP TABLE "model_3d"."model_3d_categories"`);
    await queryRunner.query(`DROP INDEX "embed"."IDX_3c9751d2a6011ba13e27838105"`);
    await queryRunner.query(`DROP INDEX "embed"."IDX_c4f6ccad30c0862eb54af9fb0a"`);
    await queryRunner.query(`DROP TABLE "embed"."api_key"`);
    await queryRunner.query(`DROP TABLE "embed"."model_view_log"`);
    await queryRunner.query(`DROP TABLE "embed"."embed_project"`);
    await queryRunner.query(`DROP INDEX "embed"."IDX_229c0ba88bd06b24680ac463cd"`);
    await queryRunner.query(`DROP TABLE "embed"."embed_domain_whitelist"`);
    await queryRunner.query(`DROP INDEX "model_3d"."IDX_b80aceefc003bd2f83134a52e3"`);
    await queryRunner.query(`DROP TABLE "model_3d"."model_annotation"`);
    await queryRunner.query(`DROP INDEX "model_3d"."IDX_3ce76f692aff8ff3694be52292"`);
    await queryRunner.query(`DROP TABLE "model_3d"."model_audio"`);
    await queryRunner.query(`DROP INDEX "model_3d"."IDX_c2f04c5890af6074b7a067a4bb"`);
    await queryRunner.query(`DROP TABLE "model_3d"."model_comment"`);
    await queryRunner.query(`DROP TABLE "model_3d"."model_display_config"`);
    await queryRunner.query(`DROP INDEX "model_3d"."IDX_477f95ecfbb245c3d37bb498b7"`);
    await queryRunner.query(`DROP TABLE "model_3d"."model_light"`);
    await queryRunner.query(`DROP INDEX "model_3d"."IDX_d99643860e4dd6c7090aba0b87"`);
    await queryRunner.query(`DROP TABLE "model_3d"."model_material_override"`);
    await queryRunner.query(`DROP INDEX "notifications"."IDX_af4870a2f8b5443a1fe1aecd4c"`);
    await queryRunner.query(`DROP TABLE "notifications"."notification"`);
    await queryRunner.query(`DROP TABLE "organizations"."org_invite"`);
    await queryRunner.query(`DROP TYPE "organizations"."org_invite_role_enum"`);
    await queryRunner.query(`DROP TABLE "organizations"."org_member"`);
    await queryRunner.query(`DROP TYPE "organizations"."org_member_role_enum"`);
    await queryRunner.query(`DROP TABLE "organizations"."org_subscription"`);
    await queryRunner.query(`DROP TYPE "organizations"."org_subscription_storage_backend_enum"`);
    await queryRunner.query(`DROP INDEX "organizations"."IDX_d9b51bb680364bb6f3eb517986"`);
    await queryRunner.query(`DROP TABLE "organizations"."webhook_delivery_log"`);
    await queryRunner.query(`DROP INDEX "organizations"."IDX_e5b373ad53378b074b96c3eec6"`);
    await queryRunner.query(`DROP TABLE "organizations"."webhook"`);
    await queryRunner.query(`DROP INDEX "scenes"."IDX_25dc129326c6f5742142cab1fd"`);
    await queryRunner.query(`DROP TABLE "scenes"."scene_annotation"`);
    await queryRunner.query(`DROP INDEX "scenes"."IDX_cd0c4903677148e4c659866d3f"`);
    await queryRunner.query(`DROP INDEX "scenes"."IDX_6fb63573b348c0d599da9de6c8"`);
    await queryRunner.query(`DROP TABLE "scenes"."scene_comment"`);
    await queryRunner.query(`DROP TABLE "scenes"."scene"`);
    await queryRunner.query(`DROP TYPE "scenes"."scene_visibility_enum"`);
    await queryRunner.query(`DROP INDEX "scenes"."IDX_c8291dae9f58ca1d1f50dc2842"`);
    await queryRunner.query(`DROP TABLE "scenes"."scene_object"`);
    await queryRunner.query(`DROP TABLE "scenes"."scene_light"`);
    await queryRunner.query(`DROP TYPE "scenes"."scene_light_type_enum"`);
    await queryRunner.query(`DROP TABLE "users"."user_reset_password"`);
    await queryRunner.query(`DROP TABLE "workspaces"."workspace_member"`);
    await queryRunner.query(`DROP TYPE "workspaces"."workspace_member_role_enum"`);
    await queryRunner.query(`DROP TABLE "users"."user"`);
    await queryRunner.query(`DROP TABLE "users"."user_meta"`);
    await queryRunner.query(`DROP TABLE "resources"."cg_soft"`);
    await queryRunner.query(`DROP TABLE "users"."role"`);
    await queryRunner.query(`DROP TABLE "auth"."session"`);
    await queryRunner.query(`DROP TABLE "model_3d"."model_3d"`);
    await queryRunner.query(`DROP TYPE "model_3d"."model_visibility"`);
    await queryRunner.query(`DROP TABLE "resources"."category"`);
    await queryRunner.query(`DROP INDEX "model_3d"."IDX_959afe36ff1a069b7cfbdb65ec"`);
    await queryRunner.query(`DROP TABLE "model_3d"."model_version"`);
    await queryRunner.query(`DROP TABLE "model_3d"."model_3d_file"`);
    await queryRunner.query(`DROP TABLE "workspaces"."workspace"`);
    await queryRunner.query(`DROP TABLE "organizations"."organization"`);
    await queryRunner.query(`DROP TYPE "organizations"."organization_plan_type_enum"`);
  }
}
