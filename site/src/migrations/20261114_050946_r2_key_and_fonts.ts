import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "book_files" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "interface_text" ADD COLUMN "reader_fonts_noto" varchar DEFAULT 'নোটো সেরিফ';
  ALTER TABLE "interface_text" ADD COLUMN "reader_fonts_hind" varchar DEFAULT 'হিন্দ শিলিগুড়ি';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP COLUMN "_objectkey";
  ALTER TABLE "book_files" DROP COLUMN "_objectkey";
  ALTER TABLE "interface_text" DROP COLUMN "reader_fonts_noto";
  ALTER TABLE "interface_text" DROP COLUMN "reader_fonts_hind";`)
}
