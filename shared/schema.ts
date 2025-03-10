import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Transcription Schema
export const transcriptions = pgTable("transcriptions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  platform: text("platform").notNull(),
  meetingName: text("meeting_name"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  content: text("content").notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const insertTranscriptionSchema = createInsertSchema(transcriptions).omit({
  id: true,
  endTime: true,
});

// Transcript Line Schema
export const transcriptLines = pgTable("transcript_lines", {
  id: serial("id").primaryKey(),
  transcriptionId: integer("transcription_id").references(() => transcriptions.id),
  timestamp: timestamp("timestamp").notNull(),
  speaker: text("speaker"),
  content: text("content").notNull(),
  isCopied: boolean("is_copied").default(false),
});

export const insertTranscriptLineSchema = createInsertSchema(transcriptLines).omit({
  id: true,
});

// Settings Schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  platform: text("platform").default("zoom"),
  autoCopy: boolean("auto_copy").default(true),
  cleanFormatting: boolean("clean_formatting").default(true),
  targetApp: text("target_app").default("default"),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

export const updateSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  userId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Transcription = typeof transcriptions.$inferSelect;
export type InsertTranscription = z.infer<typeof insertTranscriptionSchema>;

export type TranscriptLine = typeof transcriptLines.$inferSelect;
export type InsertTranscriptLine = z.infer<typeof insertTranscriptLineSchema>;

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;

// WebSocket message types
export interface TranscriptionMessage {
  type: 'transcription';
  sessionId: string;
  timestamp: string;
  speaker?: string;
  content: string;
  platform: string;
}

export interface StatusMessage {
  type: 'status';
  status: 'connected' | 'disconnected' | 'error';
  message?: string;
}

export interface SettingsUpdateMessage {
  type: 'settingsUpdate';
  settings: UpdateSettings;
}

export interface CopyStatusMessage {
  type: 'copyStatus';
  timestamp: string;
  speaker?: string;
  content: string;
  success: boolean;
}

export type WebSocketMessage = 
  | TranscriptionMessage 
  | StatusMessage 
  | SettingsUpdateMessage
  | CopyStatusMessage;
