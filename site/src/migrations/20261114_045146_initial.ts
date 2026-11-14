import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_articles_cover_source" AS ENUM('own', 'template');
  CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_version_cover_source" AS ENUM('own', 'template');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_videos_platform" AS ENUM('facebook', 'youtube');
  CREATE TYPE "public"."enum_videos_thumbnail_source" AS ENUM('own', 'youtube', 'card');
  CREATE TYPE "public"."enum_videos_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__videos_v_version_platform" AS ENUM('facebook', 'youtube');
  CREATE TYPE "public"."enum__videos_v_version_thumbnail_source" AS ENUM('own', 'youtube', 'card');
  CREATE TYPE "public"."enum__videos_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_alap_kind" AS ENUM('post', 'book');
  CREATE TYPE "public"."enum_alap_theme" AS ENUM('sunset', 'night', 'paper');
  CREATE TYPE "public"."enum_categories_kind" AS ENUM('article', 'video');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_books_role" AS ENUM('writer', 'translator');
  CREATE TYPE "public"."enum_books_genre" AS ENUM('fiction', 'nonfiction');
  CREATE TYPE "public"."enum_books_title_color" AS ENUM('default', 'dark-orange', 'orange', 'golden');
  CREATE TYPE "public"."enum_books_online_access" AS ENUM('free', 'members', 'paid');
  CREATE TYPE "public"."enum_books_online_import_from" AS ENUM('epub', 'word');
  CREATE TYPE "public"."enum_books_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__books_v_version_role" AS ENUM('writer', 'translator');
  CREATE TYPE "public"."enum__books_v_version_genre" AS ENUM('fiction', 'nonfiction');
  CREATE TYPE "public"."enum__books_v_version_title_color" AS ENUM('default', 'dark-orange', 'orange', 'golden');
  CREATE TYPE "public"."enum__books_v_version_online_access" AS ENUM('free', 'members', 'paid');
  CREATE TYPE "public"."enum__books_v_version_online_import_from" AS ENUM('epub', 'word');
  CREATE TYPE "public"."enum__books_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_chapters_title_color" AS ENUM('default', 'dark-orange', 'orange', 'golden');
  CREATE TYPE "public"."enum_ads_slots" AS ENUM('home', 'article-inline', 'article-end', 'book', 'video', 'manual');
  CREATE TYPE "public"."enum_ads_placement" AS ENUM('anywhere', 'end');
  CREATE TYPE "public"."enum_ads_mode" AS ENUM('book', 'house', 'adsense', 'custom');
  CREATE TYPE "public"."enum_ads_theme" AS ENUM('night', 'paper', 'sunset');
  CREATE TYPE "public"."enum_kindle_sends_status" AS ENUM('sent', 'failed');
  CREATE TYPE "public"."enum_orders_items_format" AS ENUM('ebook', 'print');
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('bkash-api', 'bkash-manual', 'cod');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('received', 'paid', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded');
  CREATE TYPE "public"."enum_coupons_type" AS ENUM('percent', 'fixed');
  CREATE TYPE "public"."enum_entitlements_source" AS ENUM('free', 'purchase', 'gift');
  CREATE TYPE "public"."enum_bookmarks_kind" AS ENUM('article', 'book', 'chapter');
  CREATE TYPE "public"."enum_newsletters_status" AS ENUM('draft', 'queued', 'sending', 'sent', 'failed');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'reader');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'sendNewsletter', 'schedulePublish');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'sendNewsletter', 'schedulePublish');
  CREATE TYPE "public"."enum_site_settings_social_network" AS ENUM('facebook', 'instagram', 'youtube', 'email');
  CREATE TYPE "public"."enum_site_settings_intro_title_color" AS ENUM('default', 'dark-orange', 'orange', 'golden');
  CREATE TYPE "public"."enum_site_settings_intro_spacing" AS ENUM('compact', 'normal', 'loose');
  CREATE TYPE "public"."enum_site_settings_intro_side" AS ENUM('image', 'alap');
  CREATE TABLE "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"header_photo_id" integer,
  	"header_zoom" numeric,
  	"header_focus_x" numeric,
  	"header_focus_y" numeric,
  	"header_highlight" varchar,
  	"header_line2" varchar,
  	"header_subline" varchar,
  	"cover_id" integer,
  	"cover_source" "enum_articles_cover_source",
  	"excerpt" varchar,
  	"content" jsonb,
  	"category_id" integer,
  	"author_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"featured" boolean DEFAULT false,
  	"related_book_id" integer,
  	"reading_time" numeric,
  	"slug" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topics_id" integer
  );
  
  CREATE TABLE "_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_header_photo_id" integer,
  	"version_header_zoom" numeric,
  	"version_header_focus_x" numeric,
  	"version_header_focus_y" numeric,
  	"version_header_highlight" varchar,
  	"version_header_line2" varchar,
  	"version_header_subline" varchar,
  	"version_cover_id" integer,
  	"version_cover_source" "enum__articles_v_version_cover_source",
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_category_id" integer,
  	"version_author_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_featured" boolean DEFAULT false,
  	"version_related_book_id" integer,
  	"version_reading_time" numeric,
  	"version_slug" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topics_id" integer
  );
  
  CREATE TABLE "videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"platform" "enum_videos_platform",
  	"thumbnail_id" integer,
  	"thumbnail_source" "enum_videos_thumbnail_source",
  	"card_highlight" varchar,
  	"card_line2" varchar,
  	"card_subline" varchar,
  	"description" varchar,
  	"duration" varchar,
  	"category_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"featured" boolean DEFAULT false,
  	"slug" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_videos_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "videos_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topics_id" integer
  );
  
  CREATE TABLE "_videos_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_url" varchar,
  	"version_platform" "enum__videos_v_version_platform",
  	"version_thumbnail_id" integer,
  	"version_thumbnail_source" "enum__videos_v_version_thumbnail_source",
  	"version_card_highlight" varchar,
  	"version_card_line2" varchar,
  	"version_card_subline" varchar,
  	"version_description" varchar,
  	"version_duration" varchar,
  	"version_category_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_featured" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__videos_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_videos_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topics_id" integer
  );
  
  CREATE TABLE "alap" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_alap_kind" DEFAULT 'post',
  	"book_id" integer,
  	"theme" "enum_alap_theme" DEFAULT 'sunset',
  	"text" varchar NOT NULL,
  	"image_id" integer,
  	"pinned" boolean DEFAULT false,
  	"pin_until" timestamp(3) with time zone,
  	"published" boolean DEFAULT true,
  	"published_at" timestamp(3) with time zone NOT NULL,
  	"like_count" numeric DEFAULT 0,
  	"title" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"kind" "enum_categories_kind" NOT NULL,
  	"parent_id" integer,
  	"order" numeric DEFAULT 0,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "authors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"bio" varchar,
  	"photo_id" integer,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"content" jsonb,
  	"show_contact_form" boolean DEFAULT false,
  	"slug" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_image_id" integer,
  	"version_content" jsonb,
  	"version_show_contact_form" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "books_print_buy_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"store" varchar,
  	"url" varchar,
  	"price" numeric
  );
  
  CREATE TABLE "books" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"subtitle" varchar,
  	"role" "enum_books_role" DEFAULT 'translator',
  	"genre" "enum_books_genre",
  	"original_author" varchar,
  	"original_title" varchar,
  	"title_color" "enum_books_title_color" DEFAULT 'default',
  	"cover_id" integer,
  	"about" jsonb,
  	"description" varchar,
  	"online_enabled" boolean DEFAULT false,
  	"online_access" "enum_books_online_access" DEFAULT 'free',
  	"online_sample_chapters" numeric DEFAULT 1,
  	"online_import_from" "enum_books_online_import_from" DEFAULT 'epub',
  	"online_word_file_id" integer,
  	"online_import_now" boolean DEFAULT false,
  	"online_import_report" varchar,
  	"ebook_epub_id" integer,
  	"ebook_allow_download" boolean DEFAULT true,
  	"ebook_allow_kindle" boolean DEFAULT true,
  	"print_enabled" boolean DEFAULT false,
  	"print_publisher" varchar,
  	"print_year" numeric,
  	"print_pages" numeric,
  	"print_isbn" varchar,
  	"print_badge" varchar,
  	"sale_ebook_price" numeric,
  	"sale_ebook_sale_price" numeric,
  	"sale_sale_start" timestamp(3) with time zone,
  	"sale_sale_end" timestamp(3) with time zone,
  	"sale_direct_print" boolean,
  	"sale_print_price" numeric,
  	"sale_print_sale_price" numeric,
  	"sale_stock" numeric DEFAULT 0,
  	"featured" boolean DEFAULT false,
  	"order" numeric DEFAULT 0,
  	"slug" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_books_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "books_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topics_id" integer
  );
  
  CREATE TABLE "_books_v_version_print_buy_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"store" varchar,
  	"url" varchar,
  	"price" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_books_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_subtitle" varchar,
  	"version_role" "enum__books_v_version_role" DEFAULT 'translator',
  	"version_genre" "enum__books_v_version_genre",
  	"version_original_author" varchar,
  	"version_original_title" varchar,
  	"version_title_color" "enum__books_v_version_title_color" DEFAULT 'default',
  	"version_cover_id" integer,
  	"version_about" jsonb,
  	"version_description" varchar,
  	"version_online_enabled" boolean DEFAULT false,
  	"version_online_access" "enum__books_v_version_online_access" DEFAULT 'free',
  	"version_online_sample_chapters" numeric DEFAULT 1,
  	"version_online_import_from" "enum__books_v_version_online_import_from" DEFAULT 'epub',
  	"version_online_word_file_id" integer,
  	"version_online_import_now" boolean DEFAULT false,
  	"version_online_import_report" varchar,
  	"version_ebook_epub_id" integer,
  	"version_ebook_allow_download" boolean DEFAULT true,
  	"version_ebook_allow_kindle" boolean DEFAULT true,
  	"version_print_enabled" boolean DEFAULT false,
  	"version_print_publisher" varchar,
  	"version_print_year" numeric,
  	"version_print_pages" numeric,
  	"version_print_isbn" varchar,
  	"version_print_badge" varchar,
  	"version_sale_ebook_price" numeric,
  	"version_sale_ebook_sale_price" numeric,
  	"version_sale_sale_start" timestamp(3) with time zone,
  	"version_sale_sale_end" timestamp(3) with time zone,
  	"version_sale_direct_print" boolean,
  	"version_sale_print_price" numeric,
  	"version_sale_print_sale_price" numeric,
  	"version_sale_stock" numeric DEFAULT 0,
  	"version_featured" boolean DEFAULT false,
  	"version_order" numeric DEFAULT 0,
  	"version_slug" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__books_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_books_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topics_id" integer
  );
  
  CREATE TABLE "chapters" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"book_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"order" numeric NOT NULL,
  	"word_count" numeric,
  	"title_color" "enum_chapters_title_color" DEFAULT 'default',
  	"content" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_cover_url" varchar,
  	"sizes_cover_width" numeric,
  	"sizes_cover_height" numeric,
  	"sizes_cover_mime_type" varchar,
  	"sizes_cover_filesize" numeric,
  	"sizes_cover_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar,
  	"sizes_square_url" varchar,
  	"sizes_square_width" numeric,
  	"sizes_square_height" numeric,
  	"sizes_square_mime_type" varchar,
  	"sizes_square_filesize" numeric,
  	"sizes_square_filename" varchar
  );
  
  CREATE TABLE "ads_slots" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_ads_slots",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "ads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"active" boolean DEFAULT true,
  	"placement" "enum_ads_placement" DEFAULT 'anywhere' NOT NULL,
  	"mode" "enum_ads_mode" DEFAULT 'house' NOT NULL,
  	"image_id" integer,
  	"link" varchar,
  	"book_id" integer,
  	"kicker" varchar,
  	"headline" varchar,
  	"text" varchar,
  	"theme" "enum_ads_theme" DEFAULT 'night',
  	"adsense_slot" varchar,
  	"code" varchar,
  	"start_at" timestamp(3) with time zone,
  	"end_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "book_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "subscribers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"unsubscribed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "kindle_sends" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"book_id" integer NOT NULL,
  	"ip_hash" varchar,
  	"status" "enum_kindle_sends_status",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"book_id" integer NOT NULL,
  	"format" "enum_orders_items_format" NOT NULL,
  	"quantity" numeric DEFAULT 1,
  	"unit_price" numeric NOT NULL
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"subtotal" numeric,
  	"discount" numeric DEFAULT 0,
  	"delivery" numeric DEFAULT 0,
  	"total" numeric,
  	"coupon_id" integer,
  	"payment_method" "enum_orders_payment_method",
  	"transaction_id" varchar,
  	"status" "enum_orders_status" DEFAULT 'received',
  	"shipping_name" varchar,
  	"shipping_phone" varchar,
  	"shipping_address" varchar,
  	"shipping_inside_dhaka" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "coupons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"type" "enum_coupons_type" NOT NULL,
  	"amount" numeric NOT NULL,
  	"start_at" timestamp(3) with time zone,
  	"end_at" timestamp(3) with time zone,
  	"usage_limit" numeric,
  	"used" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "coupons_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"books_id" integer
  );
  
  CREATE TABLE "entitlements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"book_id" integer NOT NULL,
  	"source" "enum_entitlements_source",
  	"order_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reading_progress" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"book_id" integer NOT NULL,
  	"chapter_id" integer,
  	"position" numeric,
  	"chapter_number" numeric,
  	"saved_at" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "bookmarks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"kind" "enum_bookmarks_kind" NOT NULL,
  	"target" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "likes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"alap_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "newsletters" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"subject" varchar NOT NULL,
  	"body" jsonb NOT NULL,
  	"test_email" varchar,
  	"send_now" boolean,
  	"status" "enum_newsletters_status" DEFAULT 'draft',
  	"sent_count" numeric DEFAULT 0,
  	"sent_at" timestamp(3) with time zone,
  	"report" varchar,
  	"cursor" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" "enum_users_role" DEFAULT 'reader' NOT NULL,
  	"kindle_email" varchar,
  	"email_verified" boolean DEFAULT false,
  	"google_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"articles_id" integer,
  	"videos_id" integer,
  	"alap_id" integer,
  	"categories_id" integer,
  	"topics_id" integer,
  	"authors_id" integer,
  	"pages_id" integer,
  	"books_id" integer,
  	"chapters_id" integer,
  	"media_id" integer,
  	"ads_id" integer,
  	"book_files_id" integer,
  	"subscribers_id" integer,
  	"messages_id" integer,
  	"kindle_sends_id" integer,
  	"orders_id" integer,
  	"coupons_id" integer,
  	"entitlements_id" integer,
  	"reading_progress_id" integer,
  	"bookmarks_id" integer,
  	"likes_id" integer,
  	"newsletters_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_intro_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"section" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "site_settings_menu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_social" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"network" "enum_site_settings_social_network" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar DEFAULT 'ননসেন্সল্যান্ড' NOT NULL,
  	"tagline" varchar DEFAULT 'Talk. Anything and Everything.',
  	"owner_name" varchar DEFAULT 'উচ্ছ্বাস তৌসিফ' NOT NULL,
  	"logo_id" integer,
  	"icon_id" integer,
  	"share_image_id" integer,
  	"intro_title" varchar DEFAULT 'যা কিছু কথা, সব কথা' NOT NULL,
  	"intro_title_color" "enum_site_settings_intro_title_color" DEFAULT 'default',
  	"intro_text" varchar DEFAULT 'ভিডিও, লেখা আর বই — ননসেন্সল্যান্ডে সব কথার আসর।',
  	"intro_spacing" "enum_site_settings_intro_spacing" DEFAULT 'normal',
  	"intro_side" "enum_site_settings_intro_side" DEFAULT 'image',
  	"intro_image_id" integer,
  	"footer_text" varchar,
  	"announcement_on" boolean DEFAULT false,
  	"announcement_text" varchar,
  	"announcement_link" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_blocks_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"title" varchar NOT NULL,
  	"show_filters" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_articles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"title" varchar NOT NULL,
  	"category_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_library" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"title" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_published" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"title" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_ad" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_alap" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"title" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_newsletter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "ad_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"adsense_client" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "interface_text" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nav_videos" varchar DEFAULT 'ভিডিও',
  	"nav_articles" varchar DEFAULT 'লেখা',
  	"nav_books" varchar DEFAULT 'বই',
  	"nav_about" varchar DEFAULT 'পরিচিতি',
  	"nav_search" varchar DEFAULT 'খুঁজুন',
  	"nav_menu" varchar DEFAULT 'মেনু',
  	"nav_close" varchar DEFAULT 'বন্ধ করুন',
  	"nav_theme_light" varchar DEFAULT 'আলো',
  	"nav_theme_dark" varchar DEFAULT 'অন্ধকার',
  	"nav_home" varchar DEFAULT 'প্রথম পাতা',
  	"common_all" varchar DEFAULT 'সব',
  	"common_see_all" varchar DEFAULT 'সব দেখুন',
  	"common_read_more" varchar DEFAULT 'পড়ুন',
  	"common_min_read" varchar DEFAULT '{n} মিনিটের পড়া',
  	"common_previous" varchar DEFAULT 'আগেরটা',
  	"common_next" varchar DEFAULT 'পরেরটা',
  	"common_back" varchar DEFAULT 'ফিরে যান',
  	"common_empty" varchar DEFAULT 'এখানে এখনো কিছু নেই।',
  	"common_loading" varchar DEFAULT 'লোড হচ্ছে…',
  	"common_topics" varchar DEFAULT 'বিষয়',
  	"video_play" varchar DEFAULT 'ভিডিও চালান',
  	"video_watch_on_facebook" varchar DEFAULT 'ফেসবুকে দেখুন',
  	"video_watch_on_youtube" varchar DEFAULT 'ইউটিউবে দেখুন',
  	"video_related" varchar DEFAULT 'আরও ভিডিও',
  	"article_by" varchar DEFAULT 'লিখেছেন',
  	"article_related" varchar DEFAULT 'আরও লেখা',
  	"article_book_promo" varchar DEFAULT 'এই লেখা ভালো লাগলে পড়ে দেখতে পারেন',
  	"book_free" varchar DEFAULT 'ই-বুক',
  	"book_price_free" varchar DEFAULT 'ফ্রি',
  	"book_ebook" varchar DEFAULT 'ই-বুক',
  	"book_buy_price" varchar DEFAULT 'কিনুন · ৳{n}',
  	"book_published" varchar DEFAULT 'আমার প্রকাশিত বই',
  	"book_start_reading" varchar DEFAULT 'পড়া শুরু করুন',
  	"book_continue_reading" varchar DEFAULT 'যেখানে থেমেছিলেন',
  	"book_chapters" varchar DEFAULT 'অধ্যায়সমূহ',
  	"book_chapter" varchar DEFAULT 'অধ্যায়',
  	"book_download" varchar DEFAULT 'EPUB ডাউনলোড',
  	"book_kindle" varchar DEFAULT 'Kindle-এ পাঠান',
  	"book_buy_from" varchar DEFAULT 'কিনুন',
  	"book_writer" varchar DEFAULT 'লেখক',
  	"book_translator" varchar DEFAULT 'অনুবাদক',
  	"book_original_author" varchar DEFAULT 'মূল লেখক',
  	"book_publisher" varchar DEFAULT 'প্রকাশক',
  	"book_pages" varchar DEFAULT 'পৃষ্ঠা',
  	"book_contents" varchar DEFAULT 'সূচিপত্র',
  	"book_finished" varchar DEFAULT 'বইটি শেষ। পড়ার জন্য ধন্যবাদ!',
  	"book_back_to_book" varchar DEFAULT 'বইয়ের পাতায় ফিরুন',
  	"book_locked" varchar DEFAULT 'এই অধ্যায়টি এখনো উন্মুক্ত নয়।',
  	"book_locked_login" varchar DEFAULT 'বাকি অধ্যায়গুলো পড়তে লগইন করুন। অ্যাকাউন্ট খোলা বিনামূল্যে।',
  	"book_locked_buy" varchar DEFAULT 'প্রথম {n} অধ্যায় পড়ার জন্য ধন্যবাদ।',
  	"book_locked_buy_links" varchar DEFAULT 'পুরো বইটি পড়তে চাইলে ছাপা বইটি কিনতে পারেন:',
  	"book_locked_buy_ebook" varchar DEFAULT 'পুরো বইটি পড়তে চাইলে কিনতে পারেন {link}।',
  	"book_locked_here" varchar DEFAULT 'এখান থেকে',
  	"book_locked_printed" varchar DEFAULT 'ছাপা বইটিও পাওয়া যাচ্ছে:',
  	"book_locked_soon" varchar DEFAULT 'পুরো বইটি অনলাইনে কেনার ব্যবস্থা শিগগিরই আসছে।',
  	"book_locked_owned" varchar DEFAULT 'আগে কিনে থাকলে লগইন করুন।',
  	"book_notes" varchar DEFAULT 'টীকা',
  	"book_filter_original" varchar DEFAULT 'মৌলিক',
  	"book_filter_translation" varchar DEFAULT 'অনুবাদ',
  	"book_filter_fiction" varchar DEFAULT 'ফিকশন',
  	"book_filter_nonfiction" varchar DEFAULT 'নন-ফিকশন',
  	"book_filter_empty" varchar DEFAULT 'এই ধরনের বই এখনো নেই।',
  	"book_back_to_text" varchar DEFAULT 'লেখায় ফিরুন',
  	"kindle_title" varchar DEFAULT 'Kindle-এ পাঠান',
  	"kindle_intro" varchar DEFAULT 'আপনার Kindle-এর ইমেইল ঠিকানা লিখুন (…@kindle.com)।',
  	"kindle_step" varchar DEFAULT 'প্রথমবার পাঠানোর আগে Amazon-এ গিয়ে “Approved Personal Document E-mail List”-এ এই ঠিকানাটি যোগ করুন:',
  	"kindle_help" varchar DEFAULT 'কীভাবে করবেন?',
  	"kindle_placeholder" varchar DEFAULT 'yourname@kindle.com',
  	"kindle_send" varchar DEFAULT 'পাঠান',
  	"kindle_sending" varchar DEFAULT 'পাঠানো হচ্ছে…',
  	"kindle_sent" varchar DEFAULT 'পাঠানো হয়েছে! কয়েক মিনিটের মধ্যে Kindle-এ বইটি চলে আসবে।',
  	"kindle_invalid" varchar DEFAULT 'সঠিক Kindle ঠিকানা দিন (…@kindle.com)।',
  	"kindle_limited" varchar DEFAULT 'অনেকবার চেষ্টা করা হয়েছে। এক ঘণ্টা পর আবার চেষ্টা করুন।',
  	"kindle_failed" varchar DEFAULT 'পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন।',
  	"kindle_not_configured" varchar DEFAULT 'Kindle-এ পাঠানো এখনো চালু হয়নি।',
  	"reader_settings" varchar DEFAULT 'পড়ার সেটিংস',
  	"reader_theme" varchar DEFAULT 'পটভূমি',
  	"reader_themes_light" varchar DEFAULT 'সাদা',
  	"reader_themes_sepia" varchar DEFAULT 'সেপিয়া',
  	"reader_themes_dark" varchar DEFAULT 'কালো',
  	"reader_font" varchar DEFAULT 'হরফ',
  	"reader_fonts_kalpurush" varchar DEFAULT 'কালপুরুষ',
  	"reader_fonts_subha" varchar DEFAULT 'শুভা',
  	"reader_size" varchar DEFAULT 'অক্ষরের আকার',
  	"reader_spacing" varchar DEFAULT 'লাইনের ফাঁক',
  	"reader_spacings_tight" varchar DEFAULT 'কম',
  	"reader_spacings_normal" varchar DEFAULT 'মাঝারি',
  	"reader_spacings_loose" varchar DEFAULT 'বেশি',
  	"reader_width" varchar DEFAULT 'পাতার চওড়া',
  	"reader_widths_narrow" varchar DEFAULT 'সরু',
  	"reader_widths_normal" varchar DEFAULT 'মাঝারি',
  	"reader_widths_wide" varchar DEFAULT 'চওড়া',
  	"reader_paragraph" varchar DEFAULT 'অনুচ্ছেদ',
  	"reader_paragraphs_gap" varchar DEFAULT 'ফাঁক রেখে',
  	"reader_paragraphs_indent" varchar DEFAULT 'ইনডেন্ট',
  	"reader_align" varchar DEFAULT 'লেখা সাজানো',
  	"reader_aligns_justify" varchar DEFAULT 'দুই পাশ সমান',
  	"reader_aligns_left" varchar DEFAULT 'বাম দিকে',
  	"reader_smaller" varchar DEFAULT 'ছোট',
  	"reader_larger" varchar DEFAULT 'বড়',
  	"reader_reset" varchar DEFAULT 'আগের মতো',
  	"share_title" varchar DEFAULT 'শেয়ার করুন',
  	"share_copy" varchar DEFAULT 'লিংক কপি',
  	"share_copied" varchar DEFAULT 'কপি হয়েছে',
  	"search_title" varchar DEFAULT 'খুঁজুন',
  	"search_placeholder" varchar DEFAULT 'লেখা, ভিডিও বা বই খুঁজুন…',
  	"search_results" varchar DEFAULT '{n}টি ফলাফল',
  	"search_none" varchar DEFAULT 'কিছু পাওয়া যায়নি।',
  	"newsletter_placeholder" varchar DEFAULT 'আপনার ইমেইল',
  	"newsletter_button" varchar DEFAULT 'যুক্ত হোন',
  	"newsletter_done" varchar DEFAULT 'ধন্যবাদ! আপনি যুক্ত হয়েছেন।',
  	"newsletter_already" varchar DEFAULT 'এই ইমেইল আগেই যুক্ত আছে।',
  	"newsletter_invalid" varchar DEFAULT 'সঠিক ইমেইল দিন।',
  	"contact_name" varchar DEFAULT 'নাম',
  	"contact_email" varchar DEFAULT 'ইমেইল',
  	"contact_message" varchar DEFAULT 'বার্তা',
  	"contact_send" varchar DEFAULT 'পাঠান',
  	"contact_done" varchar DEFAULT 'বার্তা পৌঁছেছে। ধন্যবাদ!',
  	"contact_failed" varchar DEFAULT 'পাঠানো যায়নি। আবার চেষ্টা করুন।',
  	"ad_label" varchar DEFAULT 'বিজ্ঞাপন',
  	"alap_title" varchar DEFAULT 'খুচরো আলাপ',
  	"alap_next" varchar DEFAULT 'পরেরটা',
  	"alap_previous" varchar DEFAULT 'আগেরটা',
  	"alap_hint" varchar DEFAULT 'পাশে টেনে পরের আলাপ দেখুন',
  	"alap_read_more" varchar DEFAULT 'আরও পড়ুন',
  	"alap_read_less" varchar DEFAULT 'কম দেখান',
  	"alap_read_book" varchar DEFAULT 'বইটি পড়ুন',
  	"alap_new_book" varchar DEFAULT 'নতুন বই',
  	"alap_like" varchar DEFAULT 'ভালো লেগেছে',
  	"alap_see_all" varchar DEFAULT 'সব খুচরো আলাপ দেখুন',
  	"alap_older_posts" varchar DEFAULT 'আরও পুরোনো আলাপ',
  	"alap_empty" varchar DEFAULT 'এখনো কোনো আলাপ নেই।',
  	"account_title" varchar DEFAULT 'আমার অ্যাকাউন্ট',
  	"account_login" varchar DEFAULT 'লগইন',
  	"account_logout" varchar DEFAULT 'লগআউট',
  	"account_create_account" varchar DEFAULT 'অ্যাকাউন্ট খুলুন',
  	"account_have_account" varchar DEFAULT 'অ্যাকাউন্ট আছে? লগইন করুন',
  	"account_with_google" varchar DEFAULT 'Google দিয়ে চালিয়ে যান',
  	"account_name" varchar DEFAULT 'নাম',
  	"account_email" varchar DEFAULT 'ইমেইল',
  	"account_password" varchar DEFAULT 'পাসওয়ার্ড',
  	"account_password_hint" varchar DEFAULT 'অন্তত ৮ অক্ষর',
  	"account_current_password" varchar DEFAULT 'বর্তমান পাসওয়ার্ড',
  	"account_new_password" varchar DEFAULT 'নতুন পাসওয়ার্ড',
  	"account_set_password" varchar DEFAULT 'পাসওয়ার্ড বদলান',
  	"account_change_password" varchar DEFAULT 'পাসওয়ার্ড',
  	"account_forgot" varchar DEFAULT 'পাসওয়ার্ড ভুলে গেছেন?',
  	"account_send_reset" varchar DEFAULT 'রিসেট লিংক পাঠান',
  	"account_reset_sent" varchar DEFAULT 'এই ইমেইলে অ্যাকাউন্ট থাকলে একটি লিংক পাঠানো হয়েছে।',
  	"account_reset_subject" varchar DEFAULT 'ননসেন্সল্যান্ড: পাসওয়ার্ড রিসেট',
  	"account_reset_body" varchar DEFAULT 'নিচের লিংকে গিয়ে নতুন পাসওয়ার্ড দিন। আপনি না চাইলে এই ইমেইলটি এড়িয়ে যান।',
  	"account_reset_expired" varchar DEFAULT 'লিংকটির মেয়াদ শেষ। আবার চেষ্টা করুন।',
  	"account_login_failed" varchar DEFAULT 'ইমেইল বা পাসওয়ার্ড মেলেনি।',
  	"account_signup_failed" varchar DEFAULT 'অ্যাকাউন্ট খোলা যায়নি। আবার চেষ্টা করুন।',
  	"account_google_failed" varchar DEFAULT 'Google দিয়ে লগইন হয়নি। আবার চেষ্টা করুন।',
  	"account_google_staff" varchar DEFAULT 'এই অ্যাকাউন্টে পাসওয়ার্ড দিয়ে লগইন করুন।',
  	"account_invalid" varchar DEFAULT 'তথ্যগুলো ঠিকমতো লিখুন।',
  	"account_short_password" varchar DEFAULT 'পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে।',
  	"account_wrong_password" varchar DEFAULT 'বর্তমান পাসওয়ার্ড মেলেনি।',
  	"account_email_taken" varchar DEFAULT 'এই ইমেইলে আগেই অ্যাকাউন্ট আছে।',
  	"account_want_newsletter" varchar DEFAULT 'নিউজলেটার পেতে চাই',
  	"account_kindle" varchar DEFAULT 'কিন্ডল ইমেইল',
  	"account_save" varchar DEFAULT 'সংরক্ষণ করুন',
  	"account_saved" varchar DEFAULT 'সংরক্ষণ হয়েছে।',
  	"account_settings" varchar DEFAULT 'তথ্য',
  	"account_reading" varchar DEFAULT 'যা পড়ছেন',
  	"account_no_reading" varchar DEFAULT 'এখনো কোনো বই শুরু করেননি।',
  	"account_saved_items" varchar DEFAULT 'সংরক্ষিত',
  	"account_no_saved" varchar DEFAULT 'এখনো কিছু সংরক্ষণ করেননি।',
  	"account_bookmark" varchar DEFAULT 'সংরক্ষণ',
  	"account_bookmarked" varchar DEFAULT 'সংরক্ষিত',
  	"account_unsubscribe_title" varchar DEFAULT 'নিউজলেটার বন্ধ করুন',
  	"account_unsubscribe_button" varchar DEFAULT 'আর ইমেইল চাই না',
  	"account_unsubscribed" varchar DEFAULT 'বন্ধ করা হয়েছে। আর ইমেইল যাবে না।',
  	"account_bad_link" varchar DEFAULT 'লিংকটি ঠিক নেই।',
  	"account_delete_title" varchar DEFAULT 'অ্যাকাউন্ট মুছে ফেলুন',
  	"account_delete_warning" varchar DEFAULT 'আপনার অ্যাকাউন্ট, সংরক্ষিত তালিকা, পড়ার অগ্রগতি আর ভালো লাগাগুলো চিরতরে মুছে যাবে। এটি ফেরানো যাবে না।',
  	"account_delete_confirm" varchar DEFAULT 'নিশ্চিত করতে আপনার ইমেইল লিখুন',
  	"account_delete_button" varchar DEFAULT 'চিরতরে মুছে ফেলুন',
  	"account_delete_mismatch" varchar DEFAULT 'ইমেইল মেলেনি।',
  	"account_delete_staff" varchar DEFAULT 'অ্যাডমিন অ্যাকাউন্ট এখান থেকে মোছা যায় না।',
  	"post_title" varchar DEFAULT 'নতুন খুচরো আলাপ',
  	"post_text" varchar DEFAULT 'কী বলতে চান?',
  	"post_image" varchar DEFAULT 'ছবি',
  	"post_need_image" varchar DEFAULT 'একটা ছবি দিন — প্রতিটা আলাপে ছবি লাগবে।',
  	"post_too_long" varchar DEFAULT 'লেখা ২২০ অক্ষরের মধ্যে রাখুন।',
  	"post_submit" varchar DEFAULT 'পোস্ট করুন',
  	"post_posting" varchar DEFAULT 'পোস্ট হচ্ছে…',
  	"post_done" varchar DEFAULT 'পোস্ট হয়েছে!',
  	"post_view" varchar DEFAULT 'সাইটে দেখুন',
  	"post_another" varchar DEFAULT 'আরেকটা লিখুন',
  	"post_failed" varchar DEFAULT 'পোস্ট করা যায়নি। আবার চেষ্টা করুন।',
  	"post_too_big" varchar DEFAULT 'ছবিটা অনেক বড় (সর্বোচ্চ ১০ MB)।',
  	"not_found_title" varchar DEFAULT 'পাতাটি খুঁজে পাওয়া যায়নি',
  	"not_found_text" varchar DEFAULT 'হয়তো ঠিকানা বদলেছে, অথবা পাতাটি আর নেই।',
  	"not_found_home" varchar DEFAULT 'প্রথম পাতায় ফিরুন',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "articles" ADD CONSTRAINT "articles_header_photo_id_media_id_fk" FOREIGN KEY ("header_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_related_book_id_books_id_fk" FOREIGN KEY ("related_book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_header_photo_id_media_id_fk" FOREIGN KEY ("version_header_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_author_id_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_related_book_id_books_id_fk" FOREIGN KEY ("version_related_book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos_rels" ADD CONSTRAINT "videos_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "videos_rels" ADD CONSTRAINT "videos_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_parent_id_videos_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_thumbnail_id_media_id_fk" FOREIGN KEY ("version_thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v_rels" ADD CONSTRAINT "_videos_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_videos_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_videos_v_rels" ADD CONSTRAINT "_videos_v_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "alap" ADD CONSTRAINT "alap_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "alap" ADD CONSTRAINT "alap_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "authors" ADD CONSTRAINT "authors_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "books_print_buy_links" ADD CONSTRAINT "books_print_buy_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books" ADD CONSTRAINT "books_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "books" ADD CONSTRAINT "books_online_word_file_id_book_files_id_fk" FOREIGN KEY ("online_word_file_id") REFERENCES "public"."book_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "books" ADD CONSTRAINT "books_ebook_epub_id_book_files_id_fk" FOREIGN KEY ("ebook_epub_id") REFERENCES "public"."book_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "books" ADD CONSTRAINT "books_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "books_rels" ADD CONSTRAINT "books_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books_rels" ADD CONSTRAINT "books_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v_version_print_buy_links" ADD CONSTRAINT "_books_v_version_print_buy_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_books_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v" ADD CONSTRAINT "_books_v_parent_id_books_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_books_v" ADD CONSTRAINT "_books_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_books_v" ADD CONSTRAINT "_books_v_version_online_word_file_id_book_files_id_fk" FOREIGN KEY ("version_online_word_file_id") REFERENCES "public"."book_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_books_v" ADD CONSTRAINT "_books_v_version_ebook_epub_id_book_files_id_fk" FOREIGN KEY ("version_ebook_epub_id") REFERENCES "public"."book_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_books_v" ADD CONSTRAINT "_books_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_books_v_rels" ADD CONSTRAINT "_books_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_books_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v_rels" ADD CONSTRAINT "_books_v_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "chapters" ADD CONSTRAINT "chapters_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ads_slots" ADD CONSTRAINT "ads_slots_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ads" ADD CONSTRAINT "ads_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ads" ADD CONSTRAINT "ads_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "kindle_sends" ADD CONSTRAINT "kindle_sends_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_books_fk" FOREIGN KEY ("books_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "likes" ADD CONSTRAINT "likes_alap_id_alap_id_fk" FOREIGN KEY ("alap_id") REFERENCES "public"."alap"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_alap_fk" FOREIGN KEY ("alap_id") REFERENCES "public"."alap"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_books_fk" FOREIGN KEY ("books_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_chapters_fk" FOREIGN KEY ("chapters_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ads_fk" FOREIGN KEY ("ads_id") REFERENCES "public"."ads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_book_files_fk" FOREIGN KEY ("book_files_id") REFERENCES "public"."book_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscribers_fk" FOREIGN KEY ("subscribers_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_messages_fk" FOREIGN KEY ("messages_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_kindle_sends_fk" FOREIGN KEY ("kindle_sends_id") REFERENCES "public"."kindle_sends"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_coupons_fk" FOREIGN KEY ("coupons_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_entitlements_fk" FOREIGN KEY ("entitlements_id") REFERENCES "public"."entitlements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reading_progress_fk" FOREIGN KEY ("reading_progress_id") REFERENCES "public"."reading_progress"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookmarks_fk" FOREIGN KEY ("bookmarks_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_likes_fk" FOREIGN KEY ("likes_id") REFERENCES "public"."likes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletters_fk" FOREIGN KEY ("newsletters_id") REFERENCES "public"."newsletters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_intro_buttons" ADD CONSTRAINT "site_settings_intro_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_menu" ADD CONSTRAINT "site_settings_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_social" ADD CONSTRAINT "site_settings_social_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_footer_links" ADD CONSTRAINT "site_settings_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_share_image_id_media_id_fk" FOREIGN KEY ("share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_intro_image_id_media_id_fk" FOREIGN KEY ("intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_intro" ADD CONSTRAINT "homepage_blocks_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_videos" ADD CONSTRAINT "homepage_blocks_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_articles" ADD CONSTRAINT "homepage_blocks_articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_articles" ADD CONSTRAINT "homepage_blocks_articles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_library" ADD CONSTRAINT "homepage_blocks_library_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_published" ADD CONSTRAINT "homepage_blocks_published_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_ad" ADD CONSTRAINT "homepage_blocks_ad_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_alap" ADD CONSTRAINT "homepage_blocks_alap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_newsletter" ADD CONSTRAINT "homepage_blocks_newsletter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articles_header_header_photo_idx" ON "articles" USING btree ("header_photo_id");
  CREATE INDEX "articles_cover_idx" ON "articles" USING btree ("cover_id");
  CREATE INDEX "articles_category_idx" ON "articles" USING btree ("category_id");
  CREATE INDEX "articles_author_idx" ON "articles" USING btree ("author_id");
  CREATE INDEX "articles_related_book_idx" ON "articles" USING btree ("related_book_id");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_meta_meta_image_idx" ON "articles" USING btree ("meta_image_id");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "articles" USING btree ("_status");
  CREATE INDEX "articles_rels_order_idx" ON "articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_topics_id_idx" ON "articles_rels" USING btree ("topics_id");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_header_version_header_photo_idx" ON "_articles_v" USING btree ("version_header_photo_id");
  CREATE INDEX "_articles_v_version_version_cover_idx" ON "_articles_v" USING btree ("version_cover_id");
  CREATE INDEX "_articles_v_version_version_category_idx" ON "_articles_v" USING btree ("version_category_id");
  CREATE INDEX "_articles_v_version_version_author_idx" ON "_articles_v" USING btree ("version_author_id");
  CREATE INDEX "_articles_v_version_version_related_book_idx" ON "_articles_v" USING btree ("version_related_book_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_meta_version_meta_image_idx" ON "_articles_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_rels_order_idx" ON "_articles_v_rels" USING btree ("order");
  CREATE INDEX "_articles_v_rels_parent_idx" ON "_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_articles_v_rels_path_idx" ON "_articles_v_rels" USING btree ("path");
  CREATE INDEX "_articles_v_rels_topics_id_idx" ON "_articles_v_rels" USING btree ("topics_id");
  CREATE INDEX "videos_thumbnail_idx" ON "videos" USING btree ("thumbnail_id");
  CREATE INDEX "videos_category_idx" ON "videos" USING btree ("category_id");
  CREATE UNIQUE INDEX "videos_slug_idx" ON "videos" USING btree ("slug");
  CREATE INDEX "videos_meta_meta_image_idx" ON "videos" USING btree ("meta_image_id");
  CREATE INDEX "videos_updated_at_idx" ON "videos" USING btree ("updated_at");
  CREATE INDEX "videos_created_at_idx" ON "videos" USING btree ("created_at");
  CREATE INDEX "videos__status_idx" ON "videos" USING btree ("_status");
  CREATE INDEX "videos_rels_order_idx" ON "videos_rels" USING btree ("order");
  CREATE INDEX "videos_rels_parent_idx" ON "videos_rels" USING btree ("parent_id");
  CREATE INDEX "videos_rels_path_idx" ON "videos_rels" USING btree ("path");
  CREATE INDEX "videos_rels_topics_id_idx" ON "videos_rels" USING btree ("topics_id");
  CREATE INDEX "_videos_v_parent_idx" ON "_videos_v" USING btree ("parent_id");
  CREATE INDEX "_videos_v_version_version_thumbnail_idx" ON "_videos_v" USING btree ("version_thumbnail_id");
  CREATE INDEX "_videos_v_version_version_category_idx" ON "_videos_v" USING btree ("version_category_id");
  CREATE INDEX "_videos_v_version_version_slug_idx" ON "_videos_v" USING btree ("version_slug");
  CREATE INDEX "_videos_v_version_meta_version_meta_image_idx" ON "_videos_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_videos_v_version_version_updated_at_idx" ON "_videos_v" USING btree ("version_updated_at");
  CREATE INDEX "_videos_v_version_version_created_at_idx" ON "_videos_v" USING btree ("version_created_at");
  CREATE INDEX "_videos_v_version_version__status_idx" ON "_videos_v" USING btree ("version__status");
  CREATE INDEX "_videos_v_created_at_idx" ON "_videos_v" USING btree ("created_at");
  CREATE INDEX "_videos_v_updated_at_idx" ON "_videos_v" USING btree ("updated_at");
  CREATE INDEX "_videos_v_latest_idx" ON "_videos_v" USING btree ("latest");
  CREATE INDEX "_videos_v_rels_order_idx" ON "_videos_v_rels" USING btree ("order");
  CREATE INDEX "_videos_v_rels_parent_idx" ON "_videos_v_rels" USING btree ("parent_id");
  CREATE INDEX "_videos_v_rels_path_idx" ON "_videos_v_rels" USING btree ("path");
  CREATE INDEX "_videos_v_rels_topics_id_idx" ON "_videos_v_rels" USING btree ("topics_id");
  CREATE INDEX "alap_book_idx" ON "alap" USING btree ("book_id");
  CREATE INDEX "alap_image_idx" ON "alap" USING btree ("image_id");
  CREATE INDEX "alap_updated_at_idx" ON "alap" USING btree ("updated_at");
  CREATE INDEX "alap_created_at_idx" ON "alap" USING btree ("created_at");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "topics_slug_idx" ON "topics" USING btree ("slug");
  CREATE INDEX "topics_updated_at_idx" ON "topics" USING btree ("updated_at");
  CREATE INDEX "topics_created_at_idx" ON "topics" USING btree ("created_at");
  CREATE INDEX "authors_photo_idx" ON "authors" USING btree ("photo_id");
  CREATE UNIQUE INDEX "authors_slug_idx" ON "authors" USING btree ("slug");
  CREATE INDEX "authors_updated_at_idx" ON "authors" USING btree ("updated_at");
  CREATE INDEX "authors_created_at_idx" ON "authors" USING btree ("created_at");
  CREATE INDEX "pages_image_idx" ON "pages" USING btree ("image_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_meta_meta_image_idx" ON "pages" USING btree ("meta_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_image_idx" ON "_pages_v" USING btree ("version_image_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "books_print_buy_links_order_idx" ON "books_print_buy_links" USING btree ("_order");
  CREATE INDEX "books_print_buy_links_parent_id_idx" ON "books_print_buy_links" USING btree ("_parent_id");
  CREATE INDEX "books_cover_idx" ON "books" USING btree ("cover_id");
  CREATE INDEX "books_online_online_word_file_idx" ON "books" USING btree ("online_word_file_id");
  CREATE INDEX "books_ebook_ebook_epub_idx" ON "books" USING btree ("ebook_epub_id");
  CREATE UNIQUE INDEX "books_slug_idx" ON "books" USING btree ("slug");
  CREATE INDEX "books_meta_meta_image_idx" ON "books" USING btree ("meta_image_id");
  CREATE INDEX "books_updated_at_idx" ON "books" USING btree ("updated_at");
  CREATE INDEX "books_created_at_idx" ON "books" USING btree ("created_at");
  CREATE INDEX "books__status_idx" ON "books" USING btree ("_status");
  CREATE INDEX "books_rels_order_idx" ON "books_rels" USING btree ("order");
  CREATE INDEX "books_rels_parent_idx" ON "books_rels" USING btree ("parent_id");
  CREATE INDEX "books_rels_path_idx" ON "books_rels" USING btree ("path");
  CREATE INDEX "books_rels_topics_id_idx" ON "books_rels" USING btree ("topics_id");
  CREATE INDEX "_books_v_version_print_buy_links_order_idx" ON "_books_v_version_print_buy_links" USING btree ("_order");
  CREATE INDEX "_books_v_version_print_buy_links_parent_id_idx" ON "_books_v_version_print_buy_links" USING btree ("_parent_id");
  CREATE INDEX "_books_v_parent_idx" ON "_books_v" USING btree ("parent_id");
  CREATE INDEX "_books_v_version_version_cover_idx" ON "_books_v" USING btree ("version_cover_id");
  CREATE INDEX "_books_v_version_online_version_online_word_file_idx" ON "_books_v" USING btree ("version_online_word_file_id");
  CREATE INDEX "_books_v_version_ebook_version_ebook_epub_idx" ON "_books_v" USING btree ("version_ebook_epub_id");
  CREATE INDEX "_books_v_version_version_slug_idx" ON "_books_v" USING btree ("version_slug");
  CREATE INDEX "_books_v_version_meta_version_meta_image_idx" ON "_books_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_books_v_version_version_updated_at_idx" ON "_books_v" USING btree ("version_updated_at");
  CREATE INDEX "_books_v_version_version_created_at_idx" ON "_books_v" USING btree ("version_created_at");
  CREATE INDEX "_books_v_version_version__status_idx" ON "_books_v" USING btree ("version__status");
  CREATE INDEX "_books_v_created_at_idx" ON "_books_v" USING btree ("created_at");
  CREATE INDEX "_books_v_updated_at_idx" ON "_books_v" USING btree ("updated_at");
  CREATE INDEX "_books_v_latest_idx" ON "_books_v" USING btree ("latest");
  CREATE INDEX "_books_v_rels_order_idx" ON "_books_v_rels" USING btree ("order");
  CREATE INDEX "_books_v_rels_parent_idx" ON "_books_v_rels" USING btree ("parent_id");
  CREATE INDEX "_books_v_rels_path_idx" ON "_books_v_rels" USING btree ("path");
  CREATE INDEX "_books_v_rels_topics_id_idx" ON "_books_v_rels" USING btree ("topics_id");
  CREATE INDEX "chapters_book_idx" ON "chapters" USING btree ("book_id");
  CREATE INDEX "chapters_order_idx" ON "chapters" USING btree ("order");
  CREATE INDEX "chapters_updated_at_idx" ON "chapters" USING btree ("updated_at");
  CREATE INDEX "chapters_created_at_idx" ON "chapters" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_cover_sizes_cover_filename_idx" ON "media" USING btree ("sizes_cover_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX "media_sizes_square_sizes_square_filename_idx" ON "media" USING btree ("sizes_square_filename");
  CREATE INDEX "ads_slots_order_idx" ON "ads_slots" USING btree ("order");
  CREATE INDEX "ads_slots_parent_idx" ON "ads_slots" USING btree ("parent_id");
  CREATE INDEX "ads_image_idx" ON "ads" USING btree ("image_id");
  CREATE INDEX "ads_book_idx" ON "ads" USING btree ("book_id");
  CREATE INDEX "ads_updated_at_idx" ON "ads" USING btree ("updated_at");
  CREATE INDEX "ads_created_at_idx" ON "ads" USING btree ("created_at");
  CREATE INDEX "book_files_updated_at_idx" ON "book_files" USING btree ("updated_at");
  CREATE INDEX "book_files_created_at_idx" ON "book_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "book_files_filename_idx" ON "book_files" USING btree ("filename");
  CREATE UNIQUE INDEX "subscribers_email_idx" ON "subscribers" USING btree ("email");
  CREATE INDEX "subscribers_updated_at_idx" ON "subscribers" USING btree ("updated_at");
  CREATE INDEX "subscribers_created_at_idx" ON "subscribers" USING btree ("created_at");
  CREATE INDEX "messages_updated_at_idx" ON "messages" USING btree ("updated_at");
  CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");
  CREATE INDEX "kindle_sends_book_idx" ON "kindle_sends" USING btree ("book_id");
  CREATE INDEX "kindle_sends_ip_hash_idx" ON "kindle_sends" USING btree ("ip_hash");
  CREATE INDEX "kindle_sends_updated_at_idx" ON "kindle_sends" USING btree ("updated_at");
  CREATE INDEX "kindle_sends_created_at_idx" ON "kindle_sends" USING btree ("created_at");
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_book_idx" ON "orders_items" USING btree ("book_id");
  CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");
  CREATE INDEX "orders_coupon_idx" ON "orders" USING btree ("coupon_id");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE UNIQUE INDEX "coupons_code_idx" ON "coupons" USING btree ("code");
  CREATE INDEX "coupons_updated_at_idx" ON "coupons" USING btree ("updated_at");
  CREATE INDEX "coupons_created_at_idx" ON "coupons" USING btree ("created_at");
  CREATE INDEX "coupons_rels_order_idx" ON "coupons_rels" USING btree ("order");
  CREATE INDEX "coupons_rels_parent_idx" ON "coupons_rels" USING btree ("parent_id");
  CREATE INDEX "coupons_rels_path_idx" ON "coupons_rels" USING btree ("path");
  CREATE INDEX "coupons_rels_books_id_idx" ON "coupons_rels" USING btree ("books_id");
  CREATE INDEX "entitlements_user_idx" ON "entitlements" USING btree ("user_id");
  CREATE INDEX "entitlements_book_idx" ON "entitlements" USING btree ("book_id");
  CREATE INDEX "entitlements_order_idx" ON "entitlements" USING btree ("order_id");
  CREATE INDEX "entitlements_updated_at_idx" ON "entitlements" USING btree ("updated_at");
  CREATE INDEX "entitlements_created_at_idx" ON "entitlements" USING btree ("created_at");
  CREATE INDEX "reading_progress_user_idx" ON "reading_progress" USING btree ("user_id");
  CREATE INDEX "reading_progress_book_idx" ON "reading_progress" USING btree ("book_id");
  CREATE INDEX "reading_progress_chapter_idx" ON "reading_progress" USING btree ("chapter_id");
  CREATE INDEX "reading_progress_updated_at_idx" ON "reading_progress" USING btree ("updated_at");
  CREATE INDEX "reading_progress_created_at_idx" ON "reading_progress" USING btree ("created_at");
  CREATE UNIQUE INDEX "user_book_idx" ON "reading_progress" USING btree ("user_id","book_id");
  CREATE INDEX "bookmarks_user_idx" ON "bookmarks" USING btree ("user_id");
  CREATE INDEX "bookmarks_updated_at_idx" ON "bookmarks" USING btree ("updated_at");
  CREATE INDEX "bookmarks_created_at_idx" ON "bookmarks" USING btree ("created_at");
  CREATE UNIQUE INDEX "user_kind_target_idx" ON "bookmarks" USING btree ("user_id","kind","target");
  CREATE INDEX "likes_user_idx" ON "likes" USING btree ("user_id");
  CREATE INDEX "likes_alap_idx" ON "likes" USING btree ("alap_id");
  CREATE INDEX "likes_updated_at_idx" ON "likes" USING btree ("updated_at");
  CREATE INDEX "likes_created_at_idx" ON "likes" USING btree ("created_at");
  CREATE UNIQUE INDEX "user_alap_idx" ON "likes" USING btree ("user_id","alap_id");
  CREATE INDEX "newsletters_updated_at_idx" ON "newsletters" USING btree ("updated_at");
  CREATE INDEX "newsletters_created_at_idx" ON "newsletters" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_google_id_idx" ON "users" USING btree ("google_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_videos_id_idx" ON "payload_locked_documents_rels" USING btree ("videos_id");
  CREATE INDEX "payload_locked_documents_rels_alap_id_idx" ON "payload_locked_documents_rels" USING btree ("alap_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("topics_id");
  CREATE INDEX "payload_locked_documents_rels_authors_id_idx" ON "payload_locked_documents_rels" USING btree ("authors_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_books_id_idx" ON "payload_locked_documents_rels" USING btree ("books_id");
  CREATE INDEX "payload_locked_documents_rels_chapters_id_idx" ON "payload_locked_documents_rels" USING btree ("chapters_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_ads_id_idx" ON "payload_locked_documents_rels" USING btree ("ads_id");
  CREATE INDEX "payload_locked_documents_rels_book_files_id_idx" ON "payload_locked_documents_rels" USING btree ("book_files_id");
  CREATE INDEX "payload_locked_documents_rels_subscribers_id_idx" ON "payload_locked_documents_rels" USING btree ("subscribers_id");
  CREATE INDEX "payload_locked_documents_rels_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("messages_id");
  CREATE INDEX "payload_locked_documents_rels_kindle_sends_id_idx" ON "payload_locked_documents_rels" USING btree ("kindle_sends_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_coupons_id_idx" ON "payload_locked_documents_rels" USING btree ("coupons_id");
  CREATE INDEX "payload_locked_documents_rels_entitlements_id_idx" ON "payload_locked_documents_rels" USING btree ("entitlements_id");
  CREATE INDEX "payload_locked_documents_rels_reading_progress_id_idx" ON "payload_locked_documents_rels" USING btree ("reading_progress_id");
  CREATE INDEX "payload_locked_documents_rels_bookmarks_id_idx" ON "payload_locked_documents_rels" USING btree ("bookmarks_id");
  CREATE INDEX "payload_locked_documents_rels_likes_id_idx" ON "payload_locked_documents_rels" USING btree ("likes_id");
  CREATE INDEX "payload_locked_documents_rels_newsletters_id_idx" ON "payload_locked_documents_rels" USING btree ("newsletters_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_intro_buttons_order_idx" ON "site_settings_intro_buttons" USING btree ("_order");
  CREATE INDEX "site_settings_intro_buttons_parent_id_idx" ON "site_settings_intro_buttons" USING btree ("_parent_id");
  CREATE INDEX "site_settings_menu_order_idx" ON "site_settings_menu" USING btree ("_order");
  CREATE INDEX "site_settings_menu_parent_id_idx" ON "site_settings_menu" USING btree ("_parent_id");
  CREATE INDEX "site_settings_social_order_idx" ON "site_settings_social" USING btree ("_order");
  CREATE INDEX "site_settings_social_parent_id_idx" ON "site_settings_social" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_links_order_idx" ON "site_settings_footer_links" USING btree ("_order");
  CREATE INDEX "site_settings_footer_links_parent_id_idx" ON "site_settings_footer_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  CREATE INDEX "site_settings_icon_idx" ON "site_settings" USING btree ("icon_id");
  CREATE INDEX "site_settings_share_image_idx" ON "site_settings" USING btree ("share_image_id");
  CREATE INDEX "site_settings_intro_image_idx" ON "site_settings" USING btree ("intro_image_id");
  CREATE INDEX "homepage_blocks_intro_order_idx" ON "homepage_blocks_intro" USING btree ("_order");
  CREATE INDEX "homepage_blocks_intro_parent_id_idx" ON "homepage_blocks_intro" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_intro_path_idx" ON "homepage_blocks_intro" USING btree ("_path");
  CREATE INDEX "homepage_blocks_videos_order_idx" ON "homepage_blocks_videos" USING btree ("_order");
  CREATE INDEX "homepage_blocks_videos_parent_id_idx" ON "homepage_blocks_videos" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_videos_path_idx" ON "homepage_blocks_videos" USING btree ("_path");
  CREATE INDEX "homepage_blocks_articles_order_idx" ON "homepage_blocks_articles" USING btree ("_order");
  CREATE INDEX "homepage_blocks_articles_parent_id_idx" ON "homepage_blocks_articles" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_articles_path_idx" ON "homepage_blocks_articles" USING btree ("_path");
  CREATE INDEX "homepage_blocks_articles_category_idx" ON "homepage_blocks_articles" USING btree ("category_id");
  CREATE INDEX "homepage_blocks_library_order_idx" ON "homepage_blocks_library" USING btree ("_order");
  CREATE INDEX "homepage_blocks_library_parent_id_idx" ON "homepage_blocks_library" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_library_path_idx" ON "homepage_blocks_library" USING btree ("_path");
  CREATE INDEX "homepage_blocks_published_order_idx" ON "homepage_blocks_published" USING btree ("_order");
  CREATE INDEX "homepage_blocks_published_parent_id_idx" ON "homepage_blocks_published" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_published_path_idx" ON "homepage_blocks_published" USING btree ("_path");
  CREATE INDEX "homepage_blocks_ad_order_idx" ON "homepage_blocks_ad" USING btree ("_order");
  CREATE INDEX "homepage_blocks_ad_parent_id_idx" ON "homepage_blocks_ad" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_ad_path_idx" ON "homepage_blocks_ad" USING btree ("_path");
  CREATE INDEX "homepage_blocks_alap_order_idx" ON "homepage_blocks_alap" USING btree ("_order");
  CREATE INDEX "homepage_blocks_alap_parent_id_idx" ON "homepage_blocks_alap" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_alap_path_idx" ON "homepage_blocks_alap" USING btree ("_path");
  CREATE INDEX "homepage_blocks_newsletter_order_idx" ON "homepage_blocks_newsletter" USING btree ("_order");
  CREATE INDEX "homepage_blocks_newsletter_parent_id_idx" ON "homepage_blocks_newsletter" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_newsletter_path_idx" ON "homepage_blocks_newsletter" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "articles" CASCADE;
  DROP TABLE "articles_rels" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "_articles_v_rels" CASCADE;
  DROP TABLE "videos" CASCADE;
  DROP TABLE "videos_rels" CASCADE;
  DROP TABLE "_videos_v" CASCADE;
  DROP TABLE "_videos_v_rels" CASCADE;
  DROP TABLE "alap" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "topics" CASCADE;
  DROP TABLE "authors" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "books_print_buy_links" CASCADE;
  DROP TABLE "books" CASCADE;
  DROP TABLE "books_rels" CASCADE;
  DROP TABLE "_books_v_version_print_buy_links" CASCADE;
  DROP TABLE "_books_v" CASCADE;
  DROP TABLE "_books_v_rels" CASCADE;
  DROP TABLE "chapters" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "ads_slots" CASCADE;
  DROP TABLE "ads" CASCADE;
  DROP TABLE "book_files" CASCADE;
  DROP TABLE "subscribers" CASCADE;
  DROP TABLE "messages" CASCADE;
  DROP TABLE "kindle_sends" CASCADE;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "coupons" CASCADE;
  DROP TABLE "coupons_rels" CASCADE;
  DROP TABLE "entitlements" CASCADE;
  DROP TABLE "reading_progress" CASCADE;
  DROP TABLE "bookmarks" CASCADE;
  DROP TABLE "likes" CASCADE;
  DROP TABLE "newsletters" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_intro_buttons" CASCADE;
  DROP TABLE "site_settings_menu" CASCADE;
  DROP TABLE "site_settings_social" CASCADE;
  DROP TABLE "site_settings_footer_links" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "homepage_blocks_intro" CASCADE;
  DROP TABLE "homepage_blocks_videos" CASCADE;
  DROP TABLE "homepage_blocks_articles" CASCADE;
  DROP TABLE "homepage_blocks_library" CASCADE;
  DROP TABLE "homepage_blocks_published" CASCADE;
  DROP TABLE "homepage_blocks_ad" CASCADE;
  DROP TABLE "homepage_blocks_alap" CASCADE;
  DROP TABLE "homepage_blocks_newsletter" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "ad_settings" CASCADE;
  DROP TABLE "interface_text" CASCADE;
  DROP TYPE "public"."enum_articles_cover_source";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum__articles_v_version_cover_source";
  DROP TYPE "public"."enum__articles_v_version_status";
  DROP TYPE "public"."enum_videos_platform";
  DROP TYPE "public"."enum_videos_thumbnail_source";
  DROP TYPE "public"."enum_videos_status";
  DROP TYPE "public"."enum__videos_v_version_platform";
  DROP TYPE "public"."enum__videos_v_version_thumbnail_source";
  DROP TYPE "public"."enum__videos_v_version_status";
  DROP TYPE "public"."enum_alap_kind";
  DROP TYPE "public"."enum_alap_theme";
  DROP TYPE "public"."enum_categories_kind";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_books_role";
  DROP TYPE "public"."enum_books_genre";
  DROP TYPE "public"."enum_books_title_color";
  DROP TYPE "public"."enum_books_online_access";
  DROP TYPE "public"."enum_books_online_import_from";
  DROP TYPE "public"."enum_books_status";
  DROP TYPE "public"."enum__books_v_version_role";
  DROP TYPE "public"."enum__books_v_version_genre";
  DROP TYPE "public"."enum__books_v_version_title_color";
  DROP TYPE "public"."enum__books_v_version_online_access";
  DROP TYPE "public"."enum__books_v_version_online_import_from";
  DROP TYPE "public"."enum__books_v_version_status";
  DROP TYPE "public"."enum_chapters_title_color";
  DROP TYPE "public"."enum_ads_slots";
  DROP TYPE "public"."enum_ads_placement";
  DROP TYPE "public"."enum_ads_mode";
  DROP TYPE "public"."enum_ads_theme";
  DROP TYPE "public"."enum_kindle_sends_status";
  DROP TYPE "public"."enum_orders_items_format";
  DROP TYPE "public"."enum_orders_payment_method";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_coupons_type";
  DROP TYPE "public"."enum_entitlements_source";
  DROP TYPE "public"."enum_bookmarks_kind";
  DROP TYPE "public"."enum_newsletters_status";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_site_settings_social_network";
  DROP TYPE "public"."enum_site_settings_intro_title_color";
  DROP TYPE "public"."enum_site_settings_intro_spacing";
  DROP TYPE "public"."enum_site_settings_intro_side";`)
}
