const express = require('express');
const cors = require('cors');
const path = require('path');
const setup = require('./setup');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const shiftRoutes = require('./routes/shifts');
const timeRecordRoutes = require('./routes/timeRecords');
const adjustmentRequestRoutes = require('./routes/adjustmentRequests');
const manualAdjustmentsRoutes = require('./routes/manualAdjustments');
const debugRoutes = require('./routes/debug');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ charset: 'utf-8' }));

const apiJsonMiddleware = (req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
};

async function startServer() {
  await setup();

  app.use('/api/auth', apiJsonMiddleware, authRoutes);
  app.use('/api/users', apiJsonMiddleware, userRoutes);
  app.use('/api/shifts', apiJsonMiddleware, shiftRoutes);
  app.use('/api/time-records', apiJsonMiddleware, timeRecordRoutes);
  app.use('/api/adjustment-requests', apiJsonMiddleware, adjustmentRequestRoutes);
  app.use('/api/manual', apiJsonMiddleware, manualAdjustmentsRoutes);
  app.use('/api/debug', apiJsonMiddleware, debugRoutes);

  app.get('/api/health', apiJsonMiddleware, (req, res) => {
    res.json({ status: 'ok', message: 'VivaPonto API rodando' });
  });

  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
  });

  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor VivaPonto rodando na porta ${PORT}`);
    console.log(`📊 API disponível em http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend disponível em http://localhost:${PORT}`);
    console.log(`✨ Pronto para receber requisições!\n`);
  });
}

startServer().catch(err => {
  console.error('❌ Erro ao iniciar servidor:', err);
  process.exit(1);
});
