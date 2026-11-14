import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_title_color" AS ENUM('default', 'dark-orange', 'orange', 'golden');
  CREATE TYPE "public"."enum__pages_v_version_title_color" AS ENUM('default', 'dark-orange', 'orange', 'golden');
  ALTER TABLE "pages" ADD COLUMN "title_color" "enum_pages_title_color" DEFAULT 'default';
  ALTER TABLE "_pages_v" ADD COLUMN "version_title_color" "enum__pages_v_version_title_color" DEFAULT 'default';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DROP COLUMN "title_color";
  ALTER TABLE "_pages_v" DROP COLUMN "version_title_color";
  DROP TYPE "public"."enum_pages_title_color";
  DROP TYPE "public"."enum__pages_v_version_title_color";`)
}
