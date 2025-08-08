import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoCompletionInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateTodoCompletion(input: UpdateTodoCompletionInput): Promise<Todo> {
  try {
    // Update the todo's completion status
    const result = await db.update(todosTable)
      .set({
        completed: input.completed
      })
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    // Check if todo was found and updated
    if (result.length === 0) {
      throw new Error(`Todo with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Todo completion update failed:', error);
    throw error;
  }
}