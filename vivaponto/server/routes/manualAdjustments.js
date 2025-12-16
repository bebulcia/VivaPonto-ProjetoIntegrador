const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.post('/add', authenticateToken, isAdmin, (req, res) => {
  const { user_id, date, time, type, justification } = req.body;
  const admin_id = req.user.id;

  if (!user_id || !date || !time || !type || !justification) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios, incluindo justificativa' });
  }

  console.log('[POST /manual/add] ADICIONAR BATIDA MANUAL');
  console.log('Dados:', { user_id, date, time, type, admin_id, justification });

  db.get(
    'SELECT * FROM time_records WHERE user_id = ? AND date = ? AND type = ?',
    [user_id, date, type],
    (err, existing) => {
      if (err) {
        console.error('L Erro ao verificar registro existente:', err);
        return res.status(500).json({ error: 'Erro ao verificar registro existente' });
      }

      if (existing) {
        console.log('Registro já existe para este tipo nesta data');
        return res.status(400).json({ error: 'Já existe uma batida deste tipo para esta data. Use a função de editar.' });
      }

      db.run(
        `INSERT INTO time_records (user_id, date, time, type, edited_by_admin, admin_id, admin_justification, edited_at, created_at)
         VALUES (?, ?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [user_id, date, time, type, admin_id, justification],
        function(err) {
          if (err) {
            console.error('L Erro ao adicionar batida:', err);
            return res.status(500).json({ error: 'Erro ao adicionar batida manual' });
          }

          console.log('Batida manual adicionada. ID:', this.lastID);
          res.json({
            message: 'Batida manual adicionada com sucesso',
            id: this.lastID
          });
        }
      );
    }
  );
});

router.put('/edit/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { time, justification } = req.body;
  const admin_id = req.user.id;

  if (!time || !justification) {
    return res.status(400).json({ error: 'Horário e justificativa são obrigatórios' });
  }

  console.log('[PUT /manual/edit/:id] EDITAR BATIDA');
  console.log('Dados:', { id, time, admin_id, justification });

  db.get('SELECT * FROM time_records WHERE id = ?', [id], (err, record) => {
    if (err) {
      console.error('L Erro ao buscar registro:', err);
      return res.status(500).json({ error: 'Erro ao buscar registro' });
    }

    if (!record) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    db.run(
      `UPDATE time_records
       SET time = ?, edited_by_admin = 1, admin_id = ?, admin_justification = ?, edited_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [time, admin_id, justification, id],
      function(err) {
        if (err) {
          console.error('L Erro ao editar batida:', err);
          return res.status(500).json({ error: 'Erro ao editar batida' });
        }

        console.log('Batida editada. Changes:', this.changes);
        res.json({ message: 'Batida editada com sucesso' });
      }
    );
  });
});

router.delete('/delete/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { justification } = req.body;
  const admin_id = req.user.id;

  if (!justification) {
    return res.status(400).json({ error: 'Justificativa é obrigatória para exclusão' });
  }

  console.log('[DELETE /manual/delete/:id] EXCLUIR BATIDA');
  console.log('Dados:', { id, admin_id, justification });

  db.get('SELECT * FROM time_records WHERE id = ?', [id], (err, record) => {
    if (err) {
      console.error('L Erro ao buscar registro:', err);
      return res.status(500).json({ error: 'Erro ao buscar registro' });
    }

    if (!record) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    db.run('DELETE FROM time_records WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('L Erro ao excluir batida:', err);
        return res.status(500).json({ error: 'Erro ao excluir batida' });
      }

      console.log('Batida excluída. Changes:', this.changes);
      console.log('Justificativa:', justification);
      res.json({ message: 'Batida excluída com sucesso' });
    });
  });
});

router.get('/records/:userId/:date', authenticateToken, isAdmin, (req, res) => {
  const { userId, date } = req.params;

  console.log('[GET /manual/records] BUSCAR BATIDAS DO DIA');
  console.log('Parâmetros:', { userId, date });

  db.all(
    `SELECT tr.*, u.name as user_name
     FROM time_records tr
     LEFT JOIN users u ON tr.user_id = u.id
     WHERE tr.user_id = ? AND tr.date = ?
     ORDER BY tr.time ASC`,
    [userId, date],
    (err, records) => {
      if (err) {
        console.error('L Erro ao buscar registros:', err);
        return res.status(500).json({ error: 'Erro ao buscar registros' });
      }

      console.log('Registros encontrados:', records.length);
      res.json(records || []);
    }
  );
});

module.exports = router;
