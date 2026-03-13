import express, { Application } from 'express';
import v1Router from './routes/v1';

const app: Application = express();

app.use(express.json());

app.use('/api/v1', v1Router);

export default app;
