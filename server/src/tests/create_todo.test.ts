import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTodoInput = {
  description: 'Test Todo Item'
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo', async () => {
    const result = await createTodo(testInput);

    // Basic field validation
    expect(result.description).toEqual('Test Todo Item');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save todo to database', async () => {
    const result = await createTodo(testInput);

    // Query using proper drizzle syntax
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].description).toEqual('Test Todo Item');
    expect(todos[0].completed).toEqual(false);
    expect(todos[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple todos with different descriptions', async () => {
    const firstTodo = await createTodo({ description: 'First todo' });
    const secondTodo = await createTodo({ description: 'Second todo' });

    expect(firstTodo.id).not.toEqual(secondTodo.id);
    expect(firstTodo.description).toEqual('First todo');
    expect(secondTodo.description).toEqual('Second todo');
    expect(firstTodo.completed).toEqual(false);
    expect(secondTodo.completed).toEqual(false);

    // Verify both are in database
    const allTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(allTodos).toHaveLength(2);
    expect(allTodos.map(t => t.description)).toContain('First todo');
    expect(allTodos.map(t => t.description)).toContain('Second todo');
  });

  it('should handle long descriptions correctly', async () => {
    const longDescription = 'This is a very long todo description that should be handled properly by the database and our handler function without any issues';
    const result = await createTodo({ description: longDescription });

    expect(result.description).toEqual(longDescription);
    expect(result.completed).toEqual(false);

    // Verify in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos[0].description).toEqual(longDescription);
  });

  it('should set created_at timestamp correctly', async () => {
    const beforeCreate = new Date();
    const result = await createTodo(testInput);
    const afterCreate = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });
});