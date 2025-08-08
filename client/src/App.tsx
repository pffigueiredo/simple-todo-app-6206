import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
// Using type-only import for better TypeScript compliance
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  // Explicit typing with Todo interface
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTodoDescription, setNewTodoDescription] = useState('');

  // useCallback to memoize function used in useEffect
  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []); // Empty deps since trpc is stable

  // useEffect with proper dependencies
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoDescription.trim()) return;

    setIsLoading(true);
    try {
      const todoInput: CreateTodoInput = {
        description: newTodoDescription.trim()
      };
      const newTodo = await trpc.createTodo.mutate(todoInput);
      // Update todos list with explicit typing in setState callback
      setTodos((prev: Todo[]) => [...prev, newTodo]);
      // Reset form
      setNewTodoDescription('');
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCompletion = async (todo: Todo) => {
    try {
      const updatedTodo = await trpc.updateTodoCompletion.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      // Update the specific todo in the list
      setTodos((prev: Todo[]) => 
        prev.map((t: Todo) => t.id === todo.id ? updatedTodo : t)
      );
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      await trpc.deleteTodo.mutate({ id: todoId });
      // Remove the todo from the list
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✅ Todo App</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Stats Card */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
                <div className="text-sm text-gray-500">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{totalCount - completedCount}</div>
                <div className="text-sm text-gray-500">Remaining</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Todo Form */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTodo} className="flex gap-2">
              <Input
                placeholder="What needs to be done? 🤔"
                value={newTodoDescription}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setNewTodoDescription(e.target.value)
                }
                className="flex-1"
                required
              />
              <Button type="submit" disabled={isLoading || !newTodoDescription.trim()}>
                {isLoading ? 'Adding...' : 'Add Task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todo List */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Your Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {todos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-gray-500 text-lg">No tasks yet!</p>
                <p className="text-gray-400">Add your first task above to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todos.map((todo: Todo) => (
                  <div key={todo.id} className="group">
                    <div className={`flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 ${
                      todo.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}>
                      <button
                        onClick={() => handleToggleCompletion(todo)}
                        className={`flex-shrink-0 transition-colors ${
                          todo.completed 
                            ? 'text-green-600 hover:text-green-700' 
                            : 'text-gray-400 hover:text-blue-600'
                        }`}
                      >
                        {todo.completed ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <Circle className="h-6 w-6" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-lg transition-all duration-200 ${
                          todo.completed 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-800'
                        }`}>
                          {todo.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Created: {todo.created_at.toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {todo.completed && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            ✓ Done
                          </Badge>
                        )}
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Stay productive! 🚀</p>
        </div>
      </div>
    </div>
  );
}

export default App;