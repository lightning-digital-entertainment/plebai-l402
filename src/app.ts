import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import router from './api';
import middlewares from './middlewares';


export const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json({limit: '50mb'}));

app.get('/', (req, res) => {
  res.json({
    message: '🦄🌈✨👋🌎🌍🌏✨🌈🦄',
  });
});

app.use('/v1', router);

// app.use(middlewares);
export default app;
