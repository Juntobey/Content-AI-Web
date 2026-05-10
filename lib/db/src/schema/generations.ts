import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const generationsTable = pgTable("generations", {
  id: serial("id").primaryKey(),
  feature: text("feature").notNull(),
  input: text("input").notNull(),
  audience: text("audience").notNull(),
  tone: text("tone").notNull(),
  keywords: text("keywords"),
  result: text("result").notNull(),
  wordCount: integer("word_count").notNull(),
  seoScore: integer("seo_score").notNull(),
  readability: text("readability").notNull(),
  toneMatch: text("tone_match").notNull(),
  keywordsUsed: text("keywords_used").notNull(),
  modelUsed: text("model_used").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGenerationSchema = createInsertSchema(generationsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertGeneration = z.infer<typeof insertGenerationSchema>;
export type Generation = typeof generationsTable.$inferSelect;
