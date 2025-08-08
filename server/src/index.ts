import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { createTodoInputSchema, updateTodoCompletionInputSchema, deleteTodoInputSchema } from './schema';
import { createTodo } from './handlers/create_todo';
import { getTodos } from './handlers/get_todos';
import { updateTodoCompletion } from './handlers/update_todo_completion';
import { deleteTodo } from './handlers/delete_todo';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  createTodo: publicProcedure
    .input(createTodoInputSchema)
    .mutation(({ input }) => createTodo(input)),
    
  getTodos: publicProcedure
    .query(() => getTodos()),
    
  updateTodoCompletion: publicProcedure
    .input(updateTodoCompletionInputSchema)
    .mutation(({ input }) => updateTodoCompletion(input)),
    
  deleteTodo: publicProcedure
    .input(deleteTodoInputSchema)
    .mutation(({ input }) => deleteTodo(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();