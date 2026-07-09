import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const cards = sqliteTable('cards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  note: text('note'),
  category: text('category').notNull().default('id'),
  frontImagePath: text('front_image_path').notNull(),
  backImagePath: text('back_image_path'),
  pages: text('pages'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
