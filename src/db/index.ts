import { openDatabaseSync } from 'expo-sqlite';
import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

let db: ExpoSQLiteDatabase<typeof schema>;

export function initDb() {
  const sqlite = openDatabaseSync('ivault.db');

  sqlite.execSync(
    `CREATE TABLE IF NOT EXISTS "cards" (
      "id" text PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "note" text,
      "front_image_path" text NOT NULL,
      "back_image_path" text NOT NULL,
      "created_at" integer NOT NULL,
      "updated_at" integer NOT NULL
    )`
  );

  db = drizzle(sqlite, { schema });
}

export function getDb() {
  return db;
}
