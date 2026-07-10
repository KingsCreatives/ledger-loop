import express, { Application } from 'express';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import cors from 'cors';

import v1Router from './routes/v1';
import { errorHandler } from './utils/errorHandler';

const redisClient = createClient({
  socket: { host: 'localhost', port: 6379 },
});

redisClient.connect().catch(console.error);

const sessionStore = new RedisStore({ client: redisClient });

const app: Application = express();

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json());

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use('/api/v1', v1Router);
app.use(errorHandler);

export default app;
