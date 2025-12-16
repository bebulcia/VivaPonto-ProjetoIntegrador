const express = require('express');
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, isAdmin, (req, res) => {
  db.all(
    `SELECT
      u.id, u.name, u.email, u.cpf, u.role, u.shift_id, u.created_at,
      s.id as shift_id_full,
      s.name as shift_name,
      s.start_time as shift_start_time,
      s.break_start as shift_break_start,
      s.break_end as shift_break_end,
      s.end_time as shift_end_time,
      s.total_minutes as shift_total_minutes
    FROM users u
    LEFT JOIN shifts s ON u.shift_id = s.id
    WHERE u.role = 'employee'`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar funcionários' });
      }

      const users = rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        cpf: row.cpf,
        role: row.role,
        shift_id: row.shift_id,
        created_at: row.created_at,
        shift_name: row.shift_name,
        shift: row.shift_id ? {
          id: row.shift_id_full,
          name: row.shift_name,
          start_time: row.shift_start_time,
          break_start: row.shift_break_start,
          break_end: row.shift_break_end,
          end_time: row.shift_end_time,
          total_minutes: row.shift_total_minutes
        } : null
      }));

      res.json(users);
    }
  );
});

router.get('/me', authenticateToken, (req, res) => {
  db.get(
    `SELECT
      u.id, u.name, u.email, u.cpf, u.role, u.shift_id, u.created_at,
      s.id as shift_id_full,
      s.name as shift_name,
      s.start_time as shift_start_time,
      s.break_start as shift_break_start,
      s.break_end as shift_break_end,
      s.end_time as shift_end_time,
      s.total_minutes as shift_total_minutes
    FROM users u
    LEFT JOIN shifts s ON u.shift_id = s.id
    WHERE u.id = ?`,
    [req.user.id],
    (err, row) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({ error: 'Erro ao buscar usuário' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const user = {
        id: row.id,
        name: row.name,
        email: row.email,
        cpf: row.cpf,
        role: row.role,
        shift_id: row.shift_id,
        created_at: row.created_at,
        shift: row.shift_id ? {
          id: row.shift_id_full,
          name: row.shift_name,
          start_time: row.shift_start_time,
          break_start: row.shift_break_start,
          break_end: row.shift_break_end,
          end_time: row.shift_end_time,
          total_minutes: row.shift_total_minutes
        } : null
      };

      res.json(user);
    }
  );
});

router.get('/stats', authenticateToken, isAdmin, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  db.get('SELECT COUNT(*) as total FROM users WHERE role = "employee"', [], (err, employeeCount) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar estatísticas' });

    db.get('SELECT COUNT(*) as total FROM adjustment_requests WHERE status = "pending"', [], (err, requestsCount) => {
      if (err) return res.status(500).json({ error: 'Erro ao buscar estatísticas' });

      db.get(
        `SELECT COUNT(DISTINCT user_id) as total FROM time_records WHERE date = ? AND type = 'entry'`,
        [today],
        (err, presentCount) => {
          if (err) return res.status(500).json({ error: 'Erro ao buscar estatísticas' });

          res.json({
            totalEmployees: employeeCount.total,
            pendingRequests: requestsCount.total,
            presentToday: presentCount.total
          });
        }
      );
    });
  });
});

router.put('/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { name, email, shift_id } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e email são obrigatórios' });
  }

  db.get('SELECT * FROM users WHERE id = ? AND role = "employee"', [id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar funcionário' });
    }
    if (!user) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    db.get('SELECT * FROM users WHERE email = ? AND id != ?', [email, id], (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao verificar email' });
      }
      if (existingUser) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }

      const oldShiftId = user.shift_id;
      const newShiftId = shift_id || null;
      const today = new Date().toISOString().split('T')[0];

      if (oldShiftId !== newShiftId && newShiftId !== null) {
        console.log('📝 Mudança de turno detectada. Registrando histórico...');

        if (oldShiftId) {
          db.run(
            'UPDATE user_shift_history SET end_date = ? WHERE user_id = ? AND end_date IS NULL',
            [today, id],
            (err) => {
              if (err) console.error('Erro ao fechar histórico de turno anterior:', err);
            }
          );
        }

        db.run(
          'INSERT INTO user_shift_history (user_id, shift_id, start_date) VALUES (?, ?, ?)',
          [id, newShiftId, today],
          (err) => {
            if (err) console.error('Erro ao registrar novo histórico de turno:', err);
            else console.log(`✅ Histórico registrado: User ${id} -> Turno ${newShiftId} a partir de ${today}`);
          }
        );
      }

      db.run(
        'UPDATE users SET name = ?, email = ?, shift_id = ? WHERE id = ? AND role = "employee"',
        [name, email, shift_id || null, id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar funcionário' });
          }
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Funcionário não encontrado' });
          }

          db.get(
            'SELECT u.*, s.name as shift_name FROM users u LEFT JOIN shifts s ON u.shift_id = s.id WHERE u.id = ?',
            [id],
            (err, updatedUser) => {
              if (err) {
                return res.status(500).json({ error: 'Erro ao buscar funcionário atualizado' });
              }
              const { password, ...userWithoutPassword } = updatedUser;
              res.json(userWithoutPassword);
            }
          );
        }
      );
    });
  });
});

router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
  db.run('DELETE FROM users WHERE id = ? AND role = "employee"', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar funcionário' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }
    res.json({ message: 'Funcionário deletado com sucesso' });
  });
});

module.exports = router;
