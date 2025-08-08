import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const insertResult = await db.insert(todosTable)
      .values({
        description: 'Test todo to delete',
        completed: false
      })
      .returning()
      .execute();

    const todoId = insertResult[0].id;

    // Delete the todo
    const deleteInput: DeleteTodoInput = { id: todoId };
    const result = await deleteTodo(deleteInput);

    // Should return success
    expect(result.success).toBe(true);

    // Verify todo is actually deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when deleting non-existent todo', async () => {
    // Try to delete a todo with ID that doesn't exist
    const deleteInput: DeleteTodoInput = { id: 999 };
    const result = await deleteTodo(deleteInput);

    // Should return false since no rows were affected
    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple test todos
    const insertResults = await db.insert(todosTable)
      .values([
        { description: 'First todo', completed: false },
        { description: 'Second todo', completed: true },
        { description: 'Third todo', completed: false }
      ])
      .returning()
      .execute();

    const todoToDelete = insertResults[1]; // Delete the middle one
    const deleteInput: DeleteTodoInput = { id: todoToDelete.id };

    // Delete one todo
    const result = await deleteTodo(deleteInput);
    expect(result.success).toBe(true);

    // Verify only the targeted todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    
    // Check that the deleted todo is not in the remaining todos
    const deletedTodoExists = remainingTodos.some(todo => todo.id === todoToDelete.id);
    expect(deletedTodoExists).toBe(false);

    // Verify the other todos still exist
    const firstTodoExists = remainingTodos.some(todo => todo.description === 'First todo');
    const thirdTodoExists = remainingTodos.some(todo => todo.description === 'Third todo');
    expect(firstTodoExists).toBe(true);
    expect(thirdTodoExists).toBe(true);
  });

  it('should handle consecutive deletions correctly', async () => {
    // Create test todos
    const insertResults = await db.insert(todosTable)
      .values([
        { description: 'Todo 1', completed: false },
        { description: 'Todo 2', completed: true }
      ])
      .returning()
      .execute();

    // Delete first todo
    const firstDeleteInput: DeleteTodoInput = { id: insertResults[0].id };
    const firstResult = await deleteTodo(firstDeleteInput);
    expect(firstResult.success).toBe(true);

    // Delete second todo
    const secondDeleteInput: DeleteTodoInput = { id: insertResults[1].id };
    const secondResult = await deleteTodo(secondDeleteInput);
    expect(secondResult.success).toBe(true);

    // Verify all todos are deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(0);
  });

  it('should handle deletion of already deleted todo', async () => {
    // Create a test todo
    const insertResult = await db.insert(todosTable)
      .values({
        description: 'Test todo',
        completed: false
      })
      .returning()
      .execute();

    const todoId = insertResult[0].id;
    const deleteInput: DeleteTodoInput = { id: todoId };

    // Delete the todo first time
    const firstResult = await deleteTodo(deleteInput);
    expect(firstResult.success).toBe(true);

    // Try to delete the same todo again
    const secondResult = await deleteTodo(deleteInput);
    expect(secondResult.success).toBe(false);
  });
});