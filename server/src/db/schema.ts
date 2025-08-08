import { serial, text, boolean, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const todosTable = pgTable('todos', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  completed: boolean('completed').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type Todo = typeof todosTable.$inferSelect; // For SELECT operations
export type NewTodo = typeof todosTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { todos: todosTable };