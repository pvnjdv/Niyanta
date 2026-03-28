import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

import { getDB } from './db/database';
import { getOrchestrator } from './core/NiyantaOrchestrator';
import { errorHandler } from './middleware/errorHandler';

import agentRoutes from './routes/agent.routes';
import niyantaRoutes from './routes/niyanta.routes';
import auditRoutes from './routes/audit.routes';
import metricsRoutes from './routes/metrics.routes';
import healthRoutes from './routes/health.routes';
import workflowRoutes from './routes/workflow.routes';
import portRoutes from './routes/port.routes';
import approvalRoutes from './routes/approval.routes';
import templateRoutes from './routes/template.routes';
import versionRoutes from './routes/version.routes';

const app = express();
const PORT = process.env.PORT || 3001;
const STORAGE_PATH = process.env.STORAGE_PATH || './storage';

if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}

getDB();
getOrchestrator();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

const agentLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '60', 10),
  validate: { xForwardedForHeader: false },
  message: {
    error: 'RateLimitExceeded',
    message: 'Too many AI requests. Please retry shortly.',
    timestamp: new Date().toISOString(),
  },
});

app.use('/api/agent', agentLimiter, agentRoutes);
app.use('/api/niyanta', agentLimiter, niyantaRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/port', portRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/versions', versionRoutes);

app.use('/storage', express.static(path.resolve(STORAGE_PATH)));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../build')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../build', 'index.html'));
  });
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║      NIYANTA AI — v2.0.0               ║
║      Autonomous Enterprise Governor    ║
║      नियंता — The One Who Governs     ║
╠════════════════════════════════════════╣
║  Server:    http://localhost:${PORT}        ║
║  AI:        Groq (llama-3.3-70b)       ║
║  Database:  SQLite (offline-first)     ║
║  Agents:    3 default                  ║
║  Status:    OPERATIONAL                ║
╚════════════════════════════════════════╝
`);
});

export default app;
