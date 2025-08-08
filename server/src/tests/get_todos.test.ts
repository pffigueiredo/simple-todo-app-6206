import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all todos from database', async () => {
    // Create test todos directly in database
    await db.insert(todosTable)
      .values([
        { description: 'First todo', completed: false },
        { description: 'Second todo', completed: true },
        { description: 'Third todo', completed: false }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    expect(result[0].description).toEqual('First todo');
    expect(result[0].completed).toBe(false);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    expect(result[1].description).toEqual('Second todo');
    expect(result[1].completed).toBe(true);
    
    expect(result[2].description).toEqual('Third todo');
    expect(result[2].completed).toBe(false);
  });

  it('should return todos with correct field types', async () => {
    // Insert a single todo
    await db.insert(todosTable)
      .values({ description: 'Test todo', completed: true })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    const todo = result[0];
    
    expect(typeof todo.id).toBe('number');
    expect(typeof todo.description).toBe('string');
    expect(typeof todo.completed).toBe('boolean');
    expect(todo.created_at).toBeInstanceOf(Date);
  });

  it('should preserve todo order as inserted', async () => {
    // Insert todos in specific order
    const todoDescriptions = [
      'First inserted todo',
      'Second inserted todo', 
      'Third inserted todo'
    ];

    for (const description of todoDescriptions) {
      await db.insert(todosTable)
        .values({ description, completed: false })
        .execute();
    }

    const result = await getTodos();

    expect(result).toHaveLength(3);
    expect(result[0].description).toEqual('First inserted todo');
    expect(result[1].description).toEqual('Second inserted todo');
    expect(result[2].description).toEqual('Third inserted todo');
  });

  it('should handle mixed completion states correctly', async () => {
    // Create todos with different completion states
    await db.insert(todosTable)
      .values([
        { description: 'Completed todo', completed: true },
        { description: 'Incomplete todo', completed: false },
        { description: 'Another completed', completed: true }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    const completedTodos = result.filter(todo => todo.completed);
    const incompleteTodos = result.filter(todo => !todo.completed);
    
    expect(completedTodos).toHaveLength(2);
    expect(incompleteTodos).toHaveLength(1);
    
    expect(completedTodos[0].description).toEqual('Completed todo');
    expect(completedTodos[1].description).toEqual('Another completed');
    expect(incompleteTodos[0].description).toEqual('Incomplete todo');
  });
});