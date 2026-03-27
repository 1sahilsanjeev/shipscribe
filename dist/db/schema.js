import { pgTable, text as pgText, integer as pgInteger, boolean as pgBoolean, timestamp as pgTimestamp, unique } from 'drizzle-orm/pg-core';
// We'll define a helper to create compatible columns if needed, but for now we'll define for both
// or focus on a structure that works for the Drizzle Postgres and SQLite adapters.
export const users = pgTable('users', {
    id: pgText('id').primaryKey(), // UUID
    email: pgText('email').unique().notNull(),
    passwordHash: pgText('password_hash').notNull(),
    apiKey: pgText('api_key').unique().notNull(),
    githubToken: pgText('github_token'),
    githubUsername: pgText('github_username'),
    plan: pgText('plan').default('free'),
    hasCompletedOnboarding: pgBoolean('has_completed_onboarding').default(false),
    createdAt: pgTimestamp('created_at').defaultNow(),
    updatedAt: pgTimestamp('updated_at').defaultNow(),
});
export const activities = pgTable('activities', {
    id: pgInteger('id').primaryKey(),
    userId: pgText('user_id').notNull().references(() => users.id),
    note: pgText('note').notNull(),
    source: pgText('source').notNull(),
    project: pgText('project').default('default'),
    timestamp: pgTimestamp('timestamp').defaultNow(),
    sourceId: pgText('source_id'),
}, (t) => ({
    unq: unique().on(t.userId, t.sourceId),
}));
export const tasks = pgTable('tasks', {
    id: pgInteger('id').primaryKey(),
    userId: pgText('user_id').notNull().references(() => users.id),
    title: pgText('title').notNull(),
    project: pgText('project').default('default'),
    priority: pgText('priority').default('medium'),
    status: pgText('status').default('todo'),
    createdAt: pgTimestamp('created_at').defaultNow(),
    completedAt: pgTimestamp('completed_at'),
    dueDate: pgTimestamp('due_date'),
});
export const summaries = pgTable('summaries', {
    id: pgInteger('id').primaryKey(),
    userId: pgText('user_id').notNull().references(() => users.id),
    date: pgText('date').notNull(),
    content: pgText('content').notNull(), // JSON string
    post: pgText('post'),
    createdAt: pgTimestamp('created_at').defaultNow(),
}, (t) => ({
    unq: unique().on(t.userId, t.date),
}));
export const posts = pgTable('posts', {
    id: pgInteger('id').primaryKey(),
    userId: pgText('user_id').notNull().references(() => users.id),
    summaryId: pgInteger('summary_id').references(() => summaries.id),
    platform: pgText('platform').notNull(),
    variant: pgText('variant').notNull(),
    content: pgText('content').notNull(),
    createdAt: pgTimestamp('created_at').defaultNow(),
});
export const sessionState = pgTable('session_state', {
    id: pgInteger('id').primaryKey(),
    userId: pgText('user_id').notNull().references(() => users.id),
    project: pgText('project').notNull(),
    editor: pgText('editor').default('file_watcher'),
    externalSessionId: pgText('external_session_id'),
    activeFile: pgText('active_file'),
    sessionStart: pgTimestamp('session_start').defaultNow(),
    lastActivity: pgTimestamp('last_activity').defaultNow(),
    filesTouched: pgText('files_touched').default('[]'),
    totalFilesCount: pgInteger('total_files_count').default(0),
    toolCalls: pgInteger('tool_calls').default(0),
    isActive: pgBoolean('is_active').default(true),
}, (t) => ({
    unq: unique().on(t.userId, t.project, t.externalSessionId),
}));
export const syncedEvents = pgTable('synced_events', {
    id: pgInteger('id').primaryKey(),
    userId: pgText('user_id').notNull().references(() => users.id),
    githubEventId: pgText('github_event_id').unique().notNull(),
    type: pgText('type').notNull(),
    syncedAt: pgTimestamp('synced_at').defaultNow(),
});
export const timeSessions = pgTable('time_sessions', {
    id: pgInteger('id').primaryKey(),
    userId: pgText('user_id').notNull().references(() => users.id),
    project: pgText('project').notNull(),
    startTime: pgTimestamp('start_time').defaultNow(),
    endTime: pgTimestamp('end_time'),
    durationMins: pgInteger('duration_mins').default(0),
    source: pgText('source'),
    filesTouched: pgText('files_touched').default('[]'),
    createdAt: pgTimestamp('created_at').defaultNow(),
});
