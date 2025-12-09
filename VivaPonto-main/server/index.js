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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

async function startServer() {
  await setup();

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/shifts', shiftRoutes);
  app.use('/api/time-records', timeRecordRoutes);
  app.use('/api/adjustment-requests', adjustmentRequestRoutes);
  app.use('/api/manual', manualAdjustmentsRoutes);

  app.get('/api/health', (req, res) => {
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
