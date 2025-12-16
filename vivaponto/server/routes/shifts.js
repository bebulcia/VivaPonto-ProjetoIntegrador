const express = require('express');
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM shifts ORDER BY name', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar turnos' });
    }
    res.json(rows);
  });
});

router.post('/', authenticateToken, isAdmin, (req, res) => {
  const { name, start_time, break_start, break_end, end_time, total_minutes } = req.body;

  if (!name || !start_time || !break_start || !break_end || !end_time || !total_minutes) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  db.run(
    `INSERT INTO shifts (name, start_time, break_start, break_end, end_time, total_minutes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, start_time, break_start, break_end, end_time, total_minutes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao criar turno' });
      }

      res.status(201).json({
        id: this.lastID,
        name,
        start_time,
        break_start,
        break_end,
        end_time,
        total_minutes
      });
    }
  );
});

router.put('/:id', authenticateToken, isAdmin, (req, res) => {
  const { name, start_time, break_start, break_end, end_time, total_minutes } = req.body;

  db.run(
    `UPDATE shifts SET name = ?, start_time = ?, break_start = ?, break_end = ?, end_time = ?, total_minutes = ?
     WHERE id = ?`,
    [name, start_time, break_start, break_end, end_time, total_minutes, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar turno' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Turno não encontrado' });
      }
      res.json({ message: 'Turno atualizado com sucesso' });
    }
  );
});

router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
  db.run('DELETE FROM shifts WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar turno' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Turno não encontrado' });
    }
    res.json({ message: 'Turno deletado com sucesso' });
  });
});

module.exports = router;
