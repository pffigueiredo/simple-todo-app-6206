import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoCompletionInput } from '../schema';
import { updateTodoCompletion } from '../handlers/update_todo_completion';
import { eq } from 'drizzle-orm';

describe('updateTodoCompletion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo completion status to true', async () => {
    // Create a test todo
    const [createdTodo] = await db.insert(todosTable)
      .values({
        description: 'Test todo',
        completed: false
      })
      .returning()
      .execute();

    const input: UpdateTodoCompletionInput = {
      id: createdTodo.id,
      completed: true
    };

    const result = await updateTodoCompletion(input);

    // Verify the returned data
    expect(result.id).toEqual(createdTodo.id);
    expect(result.description).toEqual('Test todo');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(createdTodo.created_at);
  });

  it('should update todo completion status to false', async () => {
    // Create a test todo that is already completed
    const [createdTodo] = await db.insert(todosTable)
      .values({
        description: 'Completed todo',
        completed: true
      })
      .returning()
      .execute();

    const input: UpdateTodoCompletionInput = {
      id: createdTodo.id,
      completed: false
    };

    const result = await updateTodoCompletion(input);

    // Verify the returned data
    expect(result.id).toEqual(createdTodo.id);
    expect(result.description).toEqual('Completed todo');
    expect(result.completed).toEqual(false);
    expect(result.created_at).toEqual(createdTodo.created_at);
  });

  it('should save updated completion status to database', async () => {
    // Create a test todo
    const [createdTodo] = await db.insert(todosTable)
      .values({
        description: 'Database test todo',
        completed: false
      })
      .returning()
      .execute();

    const input: UpdateTodoCompletionInput = {
      id: createdTodo.id,
      completed: true
    };

    await updateTodoCompletion(input);

    // Query the database to verify the update
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].description).toEqual('Database test todo');
    expect(todos[0].created_at).toEqual(createdTodo.created_at);
  });

  it('should throw error when todo does not exist', async () => {
    const input: UpdateTodoCompletionInput = {
      id: 999, // Non-existent ID
      completed: true
    };

    await expect(updateTodoCompletion(input)).rejects.toThrow(/not found/i);
  });

  it('should preserve other todo fields when updating completion', async () => {
    // Create a test todo with specific data
    const testDescription = 'Important todo item';
    const [createdTodo] = await db.insert(todosTable)
      .values({
        description: testDescription,
        completed: false
      })
      .returning()
      .execute();

    const input: UpdateTodoCompletionInput = {
      id: createdTodo.id,
      completed: true
    };

    const result = await updateTodoCompletion(input);

    // Verify that only completion status changed
    expect(result.id).toEqual(createdTodo.id);
    expect(result.description).toEqual(testDescription); // Should be unchanged
    expect(result.completed).toEqual(true); // Should be updated
    expect(result.created_at).toEqual(createdTodo.created_at); // Should be unchanged
  });

  it('should handle multiple completion status changes', async () => {
    // Create a test todo
    const [createdTodo] = await db.insert(todosTable)
      .values({
        description: 'Toggle test todo',
        completed: false
      })
      .returning()
      .execute();

    // First update: mark as completed
    const firstInput: UpdateTodoCompletionInput = {
      id: createdTodo.id,
      completed: true
    };

    const firstResult = await updateTodoCompletion(firstInput);
    expect(firstResult.completed).toEqual(true);

    // Second update: mark as not completed
    const secondInput: UpdateTodoCompletionInput = {
      id: createdTodo.id,
      completed: false
    };

    const secondResult = await updateTodoCompletion(secondInput);
    expect(secondResult.completed).toEqual(false);
    expect(secondResult.description).toEqual('Toggle test todo');
    expect(secondResult.created_at).toEqual(createdTodo.created_at);
  });
});