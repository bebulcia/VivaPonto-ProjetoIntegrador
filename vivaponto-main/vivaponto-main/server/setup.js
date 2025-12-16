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
          edited_by_admin INTEGER DEFAULT 0,
          admin_id INTEGER,
          admin_justification TEXT,
          edited_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (admin_id) REFERENCES users(id)
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
          reviewed_by INTEGER,
          reviewed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (reviewed_by) REFERENCES users(id)
        )
      `, (err) => {
        if (err) console.error('Erro ao criar tabela adjustment_requests:', err);
        else console.log('✅ Tabela adjustment_requests criada');
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS user_shift_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          shift_id INTEGER NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (shift_id) REFERENCES shifts(id)
        )
      `, (err) => {
        if (err) console.error('Erro ao criar tabela user_shift_history:', err);
        else console.log('✅ Tabela user_shift_history criada\n');
      });

      console.log('🔍 Criando índices para otimização...\n');

      db.run('CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf)', (err) => {
        if (err) console.error('Erro ao criar índice users_cpf:', err);
        else console.log('✅ Índice criado: users(cpf)');
      });

      db.run('CREATE INDEX IF NOT EXISTS idx_time_records_user_date ON time_records(user_id, date)', (err) => {
        if (err) console.error('Erro ao criar índice time_records_user_date:', err);
        else console.log('✅ Índice criado: time_records(user_id, date)');
      });

      db.run('CREATE INDEX IF NOT EXISTS idx_adjustment_requests_user_status ON adjustment_requests(user_id, status)', (err) => {
        if (err) console.error('Erro ao criar índice adjustment_requests_user_status:', err);
        else console.log('✅ Índice criado: adjustment_requests(user_id, status)');
      });

      db.run('CREATE INDEX IF NOT EXISTS idx_user_shift_history_user ON user_shift_history(user_id)', (err) => {
        if (err) console.error('Erro ao criar índice user_shift_history_user:', err);
        else console.log('✅ Índice criado: user_shift_history(user_id)\n');
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
