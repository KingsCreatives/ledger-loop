import express, { Application } from 'express';
import cors from 'cors'

import v1Router from './routes/v1';

const app: Application = express();

app.use(
  cors({
    origin: 'http://localhost:3001',
    credentials: true,
  }),
);

app.use(express.json());
app.use('/api/v1', v1Router);

export default app;
