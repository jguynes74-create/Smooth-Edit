import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  plan: text("plan").notNull().default("free"), // free, pro, business
  reputation: integer("reputation").notNull().default(0),
  totalIdeasSubmitted: integer("total_ideas_submitted").notNull().default(0),
  totalVotesReceived: integer("total_votes_received").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  originalFileName: text("original_file_name").notNull(),
  originalFilePath: text("original_file_path").notNull(),
  processedFilePath: text("processed_file_path"),
  status: text("status").notNull().default("uploaded"), // uploaded, processing, completed, failed
  fileSize: integer("file_size").notNull(),
  duration: integer("duration"), // in seconds
  issues: jsonb("issues").$type<{
    stutteredCuts?: number;
    audioSyncIssues?: boolean;
    droppedFrames?: number;
    corruptedSections?: number;
    windNoise?: boolean;
    shakyFootage?: boolean;
    poorLighting?: boolean;
    blurrySection?: boolean;
  }>(),
  fixesApplied: jsonb("fixes_applied").$type<{
    stutteredCutsFixed?: number;
    audioSyncFixed?: boolean;
    framesRecovered?: number;
    sectionsRepaired?: number;
    windNoiseRemoved?: boolean;
  }>(),
  captions: text("captions"),
  processingStartedAt: timestamp("processing_started_at"),
  processingCompletedAt: timestamp("processing_completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const drafts = pgTable("drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  isAutoSaved: boolean("is_auto_saved").default(true),
  lastModified: timestamp("last_modified").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const processingJobs = pgTable("processing_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  progress: integer("progress").default(0), // 0-100
  currentStep: text("current_step"), // analyzing, fixing_cuts, fixing_audio, adding_captions, exporting
  errorMessage: text("error_message"),
  estimatedTimeRemaining: integer("estimated_time_remaining"), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const storylineBreakdowns = pgTable("storyline_breakdowns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  scenes: jsonb("scenes").$type<Array<{
    timestamp: string;
    duration: string;
    description: string;
    emotions: string[];
    keyObjects: string[];
    actions: string[];
  }>>(),
  characters: jsonb("characters").$type<Array<{
    name: string;
    description: string;
    appearances: string[];
  }>>(),
  themes: jsonb("themes").$type<string[]>(),
  mood: text("mood"),
  genre: text("genre"),
  confidence: integer("confidence"), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
});

export const ideas = pgTable("ideas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userName: text("user_name").notNull().default("Anonymous"),
  text: text("text").notNull(),
  votes: integer("votes").notNull().default(0),
  status: text("status").default("submitted"), // submitted, considering, planned, in-progress, completed
  createdAt: timestamp("created_at").defaultNow(),
});

// Session storage table for authentication
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertVideoSchema = createInsertSchema(videos).pick({
  originalFileName: true,
  originalFilePath: true,
  fileSize: true,
  duration: true,
});

export const insertDraftSchema = createInsertSchema(drafts).pick({
  fileName: true,
  filePath: true,
  fileSize: true,
});

export const insertProcessingJobSchema = createInsertSchema(processingJobs).pick({
  videoId: true,
});

export const insertStorylineBreakdownSchema = createInsertSchema(storylineBreakdowns).pick({
  videoId: true,
  title: true,
  summary: true,
  scenes: true,
  characters: true,
  themes: true,
  mood: true,
  genre: true,
  confidence: true,
});

export const insertIdeaSchema = createInsertSchema(ideas).pick({
  userName: true,
  text: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;

export type InsertDraft = z.infer<typeof insertDraftSchema>;
export type Draft = typeof drafts.$inferSelect;

export type InsertProcessingJob = z.infer<typeof insertProcessingJobSchema>;
export type ProcessingJob = typeof processingJobs.$inferSelect;

export type InsertStorylineBreakdown = z.infer<typeof insertStorylineBreakdownSchema>;
export type StorylineBreakdown = typeof storylineBreakdowns.$inferSelect;

export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type Idea = typeof ideas.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  videos: many(videos),
  drafts: many(drafts),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  user: one(users, {
    fields: [videos.userId],
    references: [users.id],
  }),
  processingJobs: many(processingJobs),
  storylineBreakdowns: many(storylineBreakdowns),
}));

export const draftsRelations = relations(drafts, ({ one }) => ({
  user: one(users, {
    fields: [drafts.userId],
    references: [users.id],
  }),
}));

export const processingJobsRelations = relations(processingJobs, ({ one }) => ({
  video: one(videos, {
    fields: [processingJobs.videoId],
    references: [videos.id],
  }),
}));

export const storylineBreakdownsRelations = relations(storylineBreakdowns, ({ one }) => ({
  video: one(videos, {
    fields: [storylineBreakdowns.videoId],
    references: [videos.id],
  }),
}));
