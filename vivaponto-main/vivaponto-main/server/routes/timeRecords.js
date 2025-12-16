const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { user_id, date, start_date, end_date } = req.query;

  let query = 'SELECT * FROM time_records WHERE 1=1';
  const params = [];

  if (req.user.role === 'employee') {
    query += ' AND user_id = ?';
    params.push(req.user.id);
  } else if (user_id) {
    query += ' AND user_id = ?';
    params.push(user_id);
  }

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }

  if (start_date && end_date) {
    query += ' AND date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }

  query += ' ORDER BY date DESC, time DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar registros' });
    }
    res.json(rows);
  });
});

router.get('/today', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  console.log('\n🟢 [GET /today] BUSCA DE REGISTROS');
  console.log('👤 User ID:', req.user.id);
  console.log('📅 Data (today):', today);

  const query = 'SELECT * FROM time_records WHERE user_id = ? AND date = ? ORDER BY created_at ASC';
  const params = [req.user.id, today];

  console.log('📝 SQL Query:', query);
  console.log('📝 Parâmetros:', params);

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('❌ ERRO ao buscar registros:', err);
      return res.status(500).json({ error: 'Erro ao buscar registros de hoje', details: err.message });
    }

    console.log('📦 Registros encontrados no banco:', rows.length);
    console.log('📋 Dados brutos do banco:', JSON.stringify(rows, null, 2));

    const record = {
      id: null,
      user_id: req.user.id,
      date: today,
      entry: null,
      break_start: null,
      break_end: null,
      exit: null,
      created_at: null,
      updated_at: null
    };

    rows.forEach(row => {
      console.log('🔄 Processando row:', row.type, '→', row.time);
      if (row.type === 'entry') record.entry = row.time;
      if (row.type === 'break_start') record.break_start = row.time;
      if (row.type === 'break_end') record.break_end = row.time;
      if (row.type === 'exit') record.exit = row.time;
      if (!record.id) record.id = row.id;
      if (!record.created_at) record.created_at = row.created_at;
    });

    console.log('📤 Resposta final sendo enviada:', JSON.stringify(record, null, 2));

    res.json(record);
  });
});

router.post('/', authenticateToken, (req, res) => {
  const { type } = req.body;
  const user_id = req.user.id;
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const time = `${hours}:${minutes}`;

  console.log('\n🔵 [POST /time-records] INÍCIO DO REGISTRO');
  console.log('📥 Dados recebidos:', { type, user_id, date, time });

  if (!type || !['entry', 'break_start', 'break_end', 'exit'].includes(type)) {
    console.log('❌ Tipo inválido:', type);
    return res.status(400).json({ error: 'Tipo inválido' });
  }

  const query = 'INSERT INTO time_records (user_id, date, time, type) VALUES (?, ?, ?, ?)';
  const params = [user_id, date, time, type];

  console.log('📝 SQL Query:', query);
  console.log('📝 Parâmetros:', params);

  db.run(query, params, function(err) {
    if (err) {
      console.error('❌ ERRO ao inserir no banco:', err);
      return res.status(500).json({ error: 'Erro ao registrar ponto', details: err.message });
    }

    const insertedId = this.lastID;
    console.log('✅ Registro INSERIDO com sucesso! ID:', insertedId);

    db.get('SELECT * FROM time_records WHERE id = ?', [insertedId], (err, row) => {
      if (err) {
        console.error('⚠️ Erro ao verificar inserção:', err);
      } else {
        console.log('🔍 Verificação - Registro inserido:', row);
      }

      db.all('SELECT COUNT(*) as total FROM time_records WHERE user_id = ? AND date = ?',
        [user_id, date],
        (err, result) => {
          if (!err) {
            console.log('📊 Total de registros hoje para user', user_id, ':', result[0].total);
          }
        }
      );

      res.status(201).json({
        id: insertedId,
        user_id,
        date,
        time,
        type
      });
    });
  });
});

router.get('/debug', authenticateToken, (req, res) => {
  console.log('\n🔍 [GET /debug] INSPEÇÃO DO BANCO');

  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao listar tabelas', details: err.message });
    }

    console.log('📊 Tabelas existentes:', tables);

    db.all("PRAGMA table_info(time_records)", [], (err, schema) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar schema', details: err.message });
      }

      console.log('📐 Schema da tabela time_records:', schema);

      db.all('SELECT * FROM time_records LIMIT 50', [], (err, allRecords) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao buscar registros', details: err.message });
        }

        console.log('📦 Total de registros na tabela:', allRecords.length);
        console.log('📋 Primeiros registros:', allRecords.slice(0, 5));

        const today = new Date().toISOString().split('T')[0];
        db.all('SELECT * FROM time_records WHERE date = ?', [today], (err, todayRecords) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao buscar hoje', details: err.message });
          }

          res.json({
            tables: tables.map(t => t.name),
            schema: schema,
            total_records: allRecords.length,
            sample_records: allRecords.slice(0, 10),
            today_date: today,
            today_records: todayRecords,
            current_user: req.user.id
          });
        });
      });
    });
  });
});

router.get('/report', authenticateToken, (req, res) => {
  const { user_id, start_date, end_date } = req.query;

  let query = `
    SELECT
      date,
      MAX(CASE WHEN type = 'entry' THEN time END) as entry,
      MAX(CASE WHEN type = 'break_start' THEN time END) as break_start,
      MAX(CASE WHEN type = 'break_end' THEN time END) as break_end,
      MAX(CASE WHEN type = 'exit' THEN time END) as exit
    FROM time_records
    WHERE 1=1
  `;

  const params = [];

  if (req.user.role === 'employee') {
    query += ' AND user_id = ?';
    params.push(req.user.id);
  } else if (user_id) {
    query += ' AND user_id = ?';
    params.push(user_id);
  }

  if (start_date && end_date) {
    query += ' AND date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }

  query += ' GROUP BY date ORDER BY date DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Erro na query de relatório:', err);
      return res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
    res.json(rows || []);
  });
});

module.exports = router;
