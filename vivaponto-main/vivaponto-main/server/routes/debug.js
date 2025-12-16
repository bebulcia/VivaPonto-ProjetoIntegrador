const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.post('/seed-scenarios', authenticateToken, isAdmin, (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id é obrigatório' });
  }

  console.log('<1 [POST /debug/seed-scenarios] GERANDO DADOS DE TESTE');
  console.log('ID do usuário:', user_id);

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');

  db.run(
    `DELETE FROM time_records WHERE user_id = ? AND date LIKE ?`,
    [user_id, `${year}-${month}-%`],
    function(err) {
      if (err) {
        console.error('Erro ao limpar registros antigos:', err);
        return res.status(500).json({ error: 'Erro ao limpar registros antigos' });
      }

      console.log(`${this.changes} registros antigos removidos`);

      const scenarios = [];

      const day1 = `${year}-${month}-01`;
      scenarios.push(
        { user_id, date: day1, time: '08:00', type: 'entry' },
        { user_id, date: day1, time: '12:00', type: 'break_start' },
        { user_id, date: day1, time: '13:00', type: 'break_end' },
        { user_id, date: day1, time: '18:00', type: 'exit' }
      );

      const day2 = `${year}-${month}-02`;
      scenarios.push(
        { user_id, date: day2, time: '08:00', type: 'entry' }
      );

      const day3 = `${year}-${month}-03`;
      scenarios.push(
        { user_id, date: day3, time: '09:00', type: 'entry' },
        { user_id, date: day3, time: '12:00', type: 'break_start' },
        { user_id, date: day3, time: '13:00', type: 'break_end' },
        { user_id, date: day3, time: '18:00', type: 'exit' }
      );

      let inserted = 0;
      scenarios.forEach((record, index) => {
        db.run(
          `INSERT INTO time_records (user_id, date, time, type) VALUES (?, ?, ?, ?)`,
          [record.user_id, record.date, record.time, record.type],
          function(err) {
            if (err) {
              console.error(`Erro ao inserir registro ${index}:`, err);
            } else {
              inserted++;
              console.log(`Registro ${index + 1}/${scenarios.length} inserido`);
            }

            if (index === scenarios.length - 1) {
              console.log(`\nSeed completo! ${inserted} registros criados`);
              console.log('\nCenários gerados:');
              console.log(`   Dia 1 (${day1}): Dia Perfeito - 4 batidas completas`);
              console.log(`   Dia 2 (${day2}): Esquecimento - Apenas entrada, sem saída`);
              console.log(`   Dia 3 (${day3}): Atraso - Entrada com 1h de atraso\n`);

              res.json({
                message: 'Dados de teste gerados com sucesso',
                inserted,
                scenarios: [
                  {
                    date: day1,
                    description: 'Dia Perfeito',
                    details: 'Entrada e saída batendo com o turno'
                  },
                  {
                    date: day2,
                    description: 'Esquecimento',
                    details: 'Entrada existe, sem saída'
                  },
                  {
                    date: day3,
                    description: 'Atraso',
                    details: 'Entrada com 1 hora de atraso'
                  }
                ]
              });
            }
          }
        );
      });
    }
  );
});

module.exports = router;
