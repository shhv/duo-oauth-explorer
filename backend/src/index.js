import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { sessionMiddleware } from './middleware/session.js';
import { authRouter } from './routes/auth.js';
import { tokensRouter } from './routes/tokens.js';
import { protectedRouter } from './routes/protected.js';
import { dcrRouter } from './routes/dcr.js';

const app = express();

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);

app.use('/auth', authRouter);
app.use('/api', tokensRouter);
app.use('/api/protected', protectedRouter);
app.use('/api', dcrRouter);

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(config.port, () => {
  console.log(`Backend running on http://localhost:${config.port}`);
});
