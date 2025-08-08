import { z } from 'zod';

// Todo schema
export const todoSchema = z.object({
  id: z.number(),
  description: z.string(),
  completed: z.boolean(),
  created_at: z.coerce.date()
});

export type Todo = z.infer<typeof todoSchema>;

// Input schema for creating todos
export const createTodoInputSchema = z.object({
  description: z.string().min(1, "Description cannot be empty")
});

export type CreateTodoInput = z.infer<typeof createTodoInputSchema>;

// Input schema for updating todo completion status
export const updateTodoCompletionInputSchema = z.object({
  id: z.number(),
  completed: z.boolean()
});

export type UpdateTodoCompletionInput = z.infer<typeof updateTodoCompletionInputSchema>;

// Input schema for deleting todos
export const deleteTodoInputSchema = z.object({
  id: z.number()
});

export type DeleteTodoInput = z.infer<typeof deleteTodoInputSchema>;