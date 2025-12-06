const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar usuário' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Email ou senha incorretos' });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Email ou senha incorretos' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        SECRET,
        { expiresIn: '7d' }
      );

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        token,
        user: userWithoutPassword
      });
    }
  );
});

router.post('/register', async (req, res) => {
  const { name, email, cpf, password, role, shift_id } = req.body;

  if (!name || !email || !cpf || !password || !role) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (name, email, cpf, password, role, shift_id) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, email, cpf, hashedPassword, role, shift_id || null],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Email ou CPF já cadastrado' });
        }
        return res.status(500).json({ error: 'Erro ao criar usuário' });
      }

      res.status(201).json({
        id: this.lastID,
        name,
        email,
        cpf,
        role,
        shift_id
      });
    }
  );
});

module.exports = router;
