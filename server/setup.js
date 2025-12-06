const db = require('./database');
const bcrypt = require('bcryptjs');

async function setup() {
  console.log('\n🔄 Iniciando RESET TOTAL do banco de dados...\n');

  return new Promise(async (resolve, reject) => {
    const adminPassword = await bcrypt.hash('teste', 10);

    db.serialize(() => {
      console.log('🗑️  Removendo tabelas antigas...');

      db.run('DROP TABLE IF EXISTS adjustment_requests', (err) => {
        if (err) console.error('Erro ao dropar adjustment_requests:', err);
      });

      db.run('DROP TABLE IF EXISTS time_records', (err) => {
        if (err) console.error('Erro ao dropar time_records:', err);
      });

      db.run('DROP TABLE IF EXISTS users', (err) => {
        if (err) console.error('Erro ao dropar users:', err);
      });

      db.run('DROP TABLE IF EXISTS shifts', (err) => {
        if (err) console.error('Erro ao dropar shifts:', err);
        console.log('✅ Tabelas antigas removidas\n');
      });

      console.log('🔨 Criando tabelas novas...');

      db.run(`
        CREATE TABLE IF NOT EXISTS shifts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          start_time TEXT NOT NULL,
          break_start TEXT NOT NULL,
          break_end TEXT NOT NULL,
          end_time TEXT NOT NULL,
          total_minutes INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Erro ao criar tabela shifts:', err);
        else console.log('✅ Tabela shifts criada');
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          cpf TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'employee',
          shift_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (shift_id) REFERENCES shifts(id)
        )
      `, (err) => {
        if (err) console.error('Erro ao criar tabela users:', err);
        else console.log('✅ Tabela users criada');
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS time_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          type TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) console.error('Erro ao criar tabela time_records:', err);
        else console.log('✅ Tabela time_records criada');
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS adjustment_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          old_time TEXT,
          new_time TEXT NOT NULL,
          type TEXT NOT NULL,
          reason TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) console.error('Erro ao criar tabela adjustment_requests:', err);
        else console.log('✅ Tabela adjustment_requests criada\n');
      });

      console.log('📦 Inserindo dados padrão...\n');

      const shifts = [
        ['Geral 08-18h', '08:00', '12:00', '13:00', '18:00', 540],
        ['Manhã 08-17h', '08:00', '12:00', '13:00', '17:00', 480],
        ['Tarde 13-22h', '13:00', '17:00', '18:00', '22:00', 480],
        ['Noite 22-06h', '22:00', '02:00', '03:00', '06:00', 420]
      ];

      let shiftCount = 0;
      shifts.forEach(([name, start, breakStart, breakEnd, end, minutes]) => {
        db.run(
          `INSERT INTO shifts (name, start_time, break_start, break_end, end_time, total_minutes) VALUES (?, ?, ?, ?, ?, ?)`,
          [name, start, breakStart, breakEnd, end, minutes],
          function(err) {
            if (err) {
              console.error(`❌ Erro ao criar turno ${name}:`, err);
            } else {
              console.log(`✅ Turno criado: ${name}`);
              shiftCount++;

              if (shiftCount === shifts.length) {
                db.run(
                  `INSERT INTO users (name, email, cpf, password, role, shift_id) VALUES (?, ?, ?, ?, ?, ?)`,
                  ['Administrador', 'testeempresa@gmail.com', '00000000000', adminPassword, 'admin', 1],
                  (err) => {
                    if (err) {
                      console.error('❌ Erro ao criar admin:', err);
                      reject(err);
                    } else {
                      console.log('\n✅ Admin criado: testeempresa@gmail.com / teste (Turno: Geral 08-18h)');
                      console.log('\n🎉 RESET COMPLETO! Banco limpo e pronto.\n');
                      resolve();
                    }
                  }
                );
              }
            }
          }
        );
      });
    });
  });
}

module.exports = setup;
