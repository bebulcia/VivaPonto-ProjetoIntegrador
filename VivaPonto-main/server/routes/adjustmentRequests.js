const express = require('express');
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { status } = req.query;

  let query = `
    SELECT ar.*, u.name as user_name, u.email as user_email
    FROM adjustment_requests ar
    JOIN users u ON ar.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'employee') {
    query += ' AND ar.user_id = ?';
    params.push(req.user.id);
  }

  if (status) {
    query += ' AND ar.status = ?';
    params.push(status);
  }

  query += ' ORDER BY ar.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar solicitações' });
    }
    res.json(rows);
  });
});

router.post('/', authenticateToken, (req, res) => {
  const { date, old_time, new_time, type, reason } = req.body;
  const user_id = req.user.id;

  if (!date || !new_time || !type || !reason) {
    return res.status(400).json({ error: 'Campos obrigatórios: date, new_time, type, reason' });
  }

  if (!['entry', 'break_start', 'break_end', 'exit'].includes(type)) {
    return res.status(400).json({ error: 'Tipo inválido' });
  }

  db.run(
    `INSERT INTO adjustment_requests (user_id, date, old_time, new_time, type, reason)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user_id, date, old_time || null, new_time, type, reason],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao criar solicitação' });
      }

      res.status(201).json({
        id: this.lastID,
        user_id,
        date,
        old_time,
        new_time,
        type,
        reason,
        status: 'pending'
      });
    }
  );
});

router.put('/:id/approve', authenticateToken, isAdmin, (req, res) => {
  const requestId = req.params.id;
  const adminId = req.user.id;

  console.log('\n🟡 [PUT /approve] APROVAÇÃO DE AJUSTE');
  console.log('📝 Request ID:', requestId);
  console.log('👤 Admin ID:', adminId);

  db.get('SELECT * FROM adjustment_requests WHERE id = ?', [requestId], (err, request) => {
    if (err) {
      console.error('❌ Erro ao buscar solicitação:', err);
      return res.status(500).json({ error: 'Erro ao buscar solicitação' });
    }
    if (!request) {
      console.log('❌ Solicitação não encontrada');
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }
    if (request.status !== 'pending') {
      console.log('⚠️ Solicitação já processada. Status:', request.status);
      return res.status(400).json({ error: 'Solicitação já foi processada' });
    }

    console.log('📋 Dados da solicitação:', request);
    console.log('🔍 Verificando se registro já existe...');

    db.get(
      'SELECT * FROM time_records WHERE user_id = ? AND date = ? AND type = ?',
      [request.user_id, request.date, request.type],
      (err, existingRecord) => {
        if (err) {
          console.error('❌ Erro ao verificar registro existente:', err);
          return res.status(500).json({ error: 'Erro ao verificar registro existente' });
        }

        console.log('📊 Registro existente?', existingRecord ? 'SIM' : 'NÃO');
        if (existingRecord) {
          console.log('📋 Dados do registro existente:', existingRecord);
        }

        const applyAdjustment = () => {
          if (existingRecord) {
            console.log('🔄 ATUALIZANDO registro existente...');
            db.run(
              'UPDATE time_records SET time = ? WHERE id = ?',
              [request.new_time, existingRecord.id],
              function(err) {
                if (err) {
                  console.error('❌ Erro ao atualizar registro:', err);
                  return res.status(500).json({ error: 'Erro ao atualizar registro', details: err.message });
                }
                console.log('✅ Registro ATUALIZADO. Changes:', this.changes);

                db.get('SELECT * FROM time_records WHERE id = ?', [existingRecord.id], (err, updated) => {
                  console.log('🔍 Verificação após UPDATE:', updated);
                  updateRequestStatus();
                });
              }
            );
          } else {
            console.log('➕ INSERINDO novo registro...');
            const insertQuery = 'INSERT INTO time_records (user_id, date, time, type) VALUES (?, ?, ?, ?)';
            const insertParams = [request.user_id, request.date, request.new_time, request.type];

            console.log('📝 SQL:', insertQuery);
            console.log('📝 Params:', insertParams);

            db.run(insertQuery, insertParams, function(err) {
              if (err) {
                console.error('❌ Erro ao criar registro:', err);
                return res.status(500).json({ error: 'Erro ao criar registro', details: err.message });
              }
              console.log('✅ Registro CRIADO. ID:', this.lastID);

              db.get('SELECT * FROM time_records WHERE id = ?', [this.lastID], (err, inserted) => {
                console.log('🔍 Verificação após INSERT:', inserted);
                updateRequestStatus();
              });
            });
          }
        };

        const updateRequestStatus = () => {
          console.log('📝 Atualizando status da solicitação para "approved"...');
          db.run(
            'UPDATE adjustment_requests SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['approved', adminId, requestId],
            function(err) {
              if (err) {
                console.error('❌ Erro ao atualizar status:', err);
                return res.status(500).json({ error: 'Erro ao atualizar status da solicitação' });
              }
              console.log('✅ Status atualizado. Changes:', this.changes);
              console.log('🎉 APROVAÇÃO CONCLUÍDA COM SUCESSO!\n');
              res.json({ message: 'Solicitação aprovada com sucesso' });
            }
          );
        };

        applyAdjustment();
      }
    );
  });
});

router.put('/:id/reject', authenticateToken, isAdmin, (req, res) => {
  const requestId = req.params.id;
  const adminId = req.user.id;

  db.run(
    `UPDATE adjustment_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
     WHERE id = ? AND status = 'pending'`,
    [adminId, requestId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao rejeitar solicitação' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Solicitação não encontrada ou já processada' });
      }
      res.json({ message: 'Solicitação rejeitada com sucesso' });
    }
  );
});

module.exports = router;
