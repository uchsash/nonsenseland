import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "interface_text" ADD COLUMN "kindle_login_first" varchar DEFAULT 'কিন্ডলে বই পাঠাতে প্রথমে লগইন করুন।';
  ALTER TABLE "interface_text" ADD COLUMN "kindle_login_button" varchar DEFAULT 'লগইন করুন';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "interface_text" DROP COLUMN "kindle_login_first";
  ALTER TABLE "interface_text" DROP COLUMN "kindle_login_button";`)
}
