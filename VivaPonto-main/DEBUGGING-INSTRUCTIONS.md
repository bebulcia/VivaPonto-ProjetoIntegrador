# 🔍 INSTRUÇÕES DE DEBUGGING - VivaPonto

## OBJETIVO
Este documento orienta o processo de investigação forense dos problemas de persistência de dados relatados pelo usuário.

---

## 🚨 SINTOMAS REPORTADOS

### 1. Falha no Registro de Ponto
- **Ação:** Usuário clica em "Registrar Entrada"
- **Esperado:** Registro aparece na lista "Batidas de Hoje"
- **Problema:** Sistema exibe "Sucesso", mas o registro NÃO aparece na lista nem nos relatórios

### 2. Falha na Aprovação de Ajuste
- **Ação:** Admin clica em "Aprovar" na solicitação
- **Esperado:** Horário solicitado é adicionado ao relatório do funcionário
- **Problema:** Status muda para "Aprovado" visualmente, mas o ponto não é computado

### 3. Dados "Fantasmas"
- "Usuário Desconhecido" em algumas áreas
- Cálculos retornam "NaN"
- Relacionamento entre tabelas quebrado

---

## 🔧 MODIFICAÇÕES IMPLEMENTADAS PARA DEBUGGING

### 1. LOGS EXTENSIVOS ADICIONADOS

Todos os logs seguem o padrão:
```
🔵 [POST /time-records] - Operações de INSERT
🟢 [GET /today] - Operações de SELECT
🟡 [PUT /approve] - Operações de aprovação
🔍 [GET /debug] - Inspeção do banco
```

#### A. Rota POST `/api/time-records` (Registrar Ponto)
**Arquivo:** `server/routes/timeRecords.js`

**Logs adicionados:**
```javascript
console.log('\n🔵 [POST /time-records] INÍCIO DO REGISTRO');
console.log('📥 Dados recebidos:', { type, user_id, date, time });
console.log('📝 SQL Query:', query);
console.log('📝 Parâmetros:', params);
console.log('✅ Registro INSERIDO com sucesso! ID:', insertedId);
console.log('🔍 Verificação - Registro inserido:', row);
console.log('📊 Total de registros hoje para user', user_id, ':', total);
```

**O que observar:**
1. Dados recebidos do frontend estão corretos?
2. Query SQL está sendo executada?
3. ID retornado pelo `this.lastID`?
4. Verificação SELECT logo após INSERT retorna o registro?
5. Total de registros aumentou?

#### B. Rota GET `/api/time-records/today` (Buscar Ponto)
**Arquivo:** `server/routes/timeRecords.js`

**Logs adicionados:**
```javascript
console.log('\n🟢 [GET /today] BUSCA DE REGISTROS');
console.log('👤 User ID:', req.user.id);
console.log('📅 Data (today):', today);
console.log('📝 SQL Query:', query);
console.log('📝 Parâmetros:', params);
console.log('📦 Registros encontrados no banco:', rows.length);
console.log('📋 Dados brutos do banco:', JSON.stringify(rows, null, 2));
console.log('🔄 Processando row:', row.type, '→', row.time);
console.log('📤 Resposta final sendo enviada:', JSON.stringify(record, null, 2));
```

**O que observar:**
1. User ID está correto?
2. Data (today) está no formato esperado (YYYY-MM-DD)?
3. Quantos registros foram encontrados?
4. Dados brutos contêm os registros inseridos?
5. Conversão de múltiplas linhas para objeto único está funcionando?
6. Resposta final tem os campos entry/break_start/etc. preenchidos?

#### C. Rota PUT `/api/adjustment-requests/:id/approve` (Aprovar Ajuste)
**Arquivo:** `server/routes/adjustmentRequests.js`

**Logs adicionados:**
```javascript
console.log('\n🟡 [PUT /approve] APROVAÇÃO DE AJUSTE');
console.log('📝 Request ID:', requestId);
console.log('👤 Admin ID:', adminId);
console.log('📋 Dados da solicitação:', request);
console.log('🔍 Verificando se registro já existe...');
console.log('📊 Registro existente?', existingRecord ? 'SIM' : 'NÃO');
console.log('🔄 ATUALIZANDO registro existente...' OU '➕ INSERINDO novo registro...');
console.log('✅ Registro ATUALIZADO/CRIADO. ID/Changes:', ...);
console.log('🔍 Verificação após UPDATE/INSERT:', row);
console.log('✅ Status atualizado. Changes:', this.changes);
console.log('🎉 APROVAÇÃO CONCLUÍDA COM SUCESSO!');
```

**O que observar:**
1. Solicitação foi encontrada?
2. Dados da solicitação estão corretos (user_id, date, type, new_time)?
3. Sistema verificou se registro já existe?
4. Foi UPDATE ou INSERT?
5. Operação foi bem-sucedida (changes > 0)?
6. Verificação SELECT após a operação retorna o registro atualizado/criado?
7. Status da solicitação foi atualizado para "approved"?

### 2. ROTA DE DEBUG CRIADA

**Endpoint:** `GET /api/time-records/debug`
**Arquivo:** `server/routes/timeRecords.js`

**O que retorna:**
```json
{
  "tables": ["users", "shifts", "time_records", "adjustment_requests"],
  "schema": [
    { "cid": 0, "name": "id", "type": "INTEGER", ... },
    { "cid": 1, "name": "user_id", "type": "INTEGER", ... },
    { "cid": 2, "name": "date", "type": "TEXT", ... },
    { "cid": 3, "name": "time", "type": "TEXT", ... },
    { "cid": 4, "name": "type", "type": "TEXT", ... }
  ],
  "total_records": 10,
  "sample_records": [ ... ],
  "today_date": "2025-12-05",
  "today_records": [ ... ],
  "current_user": 1
}
```

**Como usar:**
```bash
# No navegador ou via curl
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3000/api/time-records/debug
```

**O que verificar:**
1. Tabela `time_records` existe?
2. Schema tem as colunas corretas: `id`, `user_id`, `date`, `time`, `type`?
3. Há registros na tabela?
4. Registros de hoje estão presentes?
5. Formato dos dados está correto?

---

## 📊 FLUXO DE INVESTIGAÇÃO PASSO A PASSO

### PASSO 1: Inicie o servidor e observe o reset do banco
```bash
npm run start
```

**Esperado no console:**
```
🔄 Iniciando RESET TOTAL do banco de dados...
🗑️  Removendo tabelas antigas...
✅ Tabelas antigas removidas
🔨 Criando tabelas novas...
✅ Tabela time_records criada
...
🎉 RESET COMPLETO! Banco limpo e pronto.
🚀 Servidor VivaPonto rodando na porta 3000
```

**Se não aparecer:** Problema no `server/setup.js` ou `server/index.js`

---

### PASSO 2: Faça login e inspecione o banco
1. Acesse http://localhost:3000
2. Login: `testeempresa@gmail.com` / `teste`
3. Abra DevTools (F12) → Network
4. Execute no navegador:
```javascript
fetch('/api/time-records/debug', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json()).then(console.log)
```

**Verifique:**
- [ ] Tabela `time_records` existe?
- [ ] Schema correto (time + type, não entry + break_start)?
- [ ] Banco está vazio (total_records: 0)?

---

### PASSO 3: Registre um ponto e observe os logs

#### 3.1. Observe o Console do Servidor
Terminal onde o servidor está rodando.

#### 3.2. Clique em "Registrar Entrada"

**Logs esperados no servidor:**
```
🔵 [POST /time-records] INÍCIO DO REGISTRO
📥 Dados recebidos: { type: 'entry', user_id: 1, date: '2025-12-05', time: '14:30:22' }
📝 SQL Query: INSERT INTO time_records (user_id, date, time, type) VALUES (?, ?, ?, ?)
📝 Parâmetros: [ 1, '2025-12-05', '14:30:22', 'entry' ]
✅ Registro INSERIDO com sucesso! ID: 1
🔍 Verificação - Registro inserido: { id: 1, user_id: 1, date: '2025-12-05', time: '14:30:22', type: 'entry', created_at: ... }
📊 Total de registros hoje para user 1 : 1
```

**Se NÃO aparecer nenhum log:**
- 🚨 Frontend não está chamando a API
- 🚨 Rota não está registrada
- 🚨 Middleware de autenticação está bloqueando

**Se aparecer erro SQL:**
- 🚨 Schema do banco está errado
- 🚨 Colunas não existem
- 🚨 Restrição de foreign key

---

### PASSO 4: Verifique se o GET busca o registro

Após registrar, o frontend chama automaticamente `/api/time-records/today`.

**Logs esperados no servidor:**
```
🟢 [GET /today] BUSCA DE REGISTROS
👤 User ID: 1
📅 Data (today): 2025-12-05
📝 SQL Query: SELECT * FROM time_records WHERE user_id = ? AND date = ? ORDER BY created_at ASC
📝 Parâmetros: [ 1, '2025-12-05' ]
📦 Registros encontrados no banco: 1
📋 Dados brutos do banco: [
  {
    "id": 1,
    "user_id": 1,
    "date": "2025-12-05",
    "time": "14:30:22",
    "type": "entry",
    "created_at": "2025-12-05 14:30:22"
  }
]
🔄 Processando row: entry → 14:30:22
📤 Resposta final sendo enviada: {
  "id": 1,
  "user_id": 1,
  "date": "2025-12-05",
  "entry": "14:30:22",
  "break_start": null,
  "break_end": null,
  "exit": null,
  "created_at": "2025-12-05 14:30:22",
  "updated_at": null
}
```

**ANÁLISE:**

✅ **Se registros foram encontrados (📦 > 0):**
- Backend está funcionando
- Problema está no frontend (não atualiza UI)

❌ **Se registros NÃO foram encontrados (📦 = 0):**
- 🔴 **PROBLEMA CRÍTICO:** INSERT está falhando silenciosamente
- 🔴 **OU:** Problema de timezone (data sendo salva diferente)
- 🔴 **OU:** Banco está sendo resetado entre requisições

❌ **Se resposta final tem entry: null:**
- 🔴 **PROBLEMA:** Conversão de rows para record está falhando
- 🔴 Verificar if (row.type === 'entry')

---

### PASSO 5: Execute a rota de debug novamente

```javascript
fetch('/api/time-records/debug', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json()).then(console.log)
```

**Verifique:**
- [ ] `total_records` aumentou para 1?
- [ ] `today_records` contém o registro inserido?
- [ ] Formato do registro está correto?

---

### PASSO 6: Teste aprovação de ajuste

#### 6.1. Crie uma solicitação de ajuste
- Login como funcionário
- Ir em "Solicitar Ajuste"
- Criar solicitação

#### 6.2. Aprove como admin
- Logout
- Login como admin
- Ir em "Central de Solicitações"
- Clicar em "Aprovar"

**Logs esperados no servidor:**
```
🟡 [PUT /approve] APROVAÇÃO DE AJUSTE
📝 Request ID: 1
👤 Admin ID: 1
📋 Dados da solicitação: { id: 1, user_id: 2, date: '2025-12-05', type: 'entry', old_time: null, new_time: '08:00:00', ... }
🔍 Verificando se registro já existe...
📊 Registro existente? NÃO
➕ INSERINDO novo registro...
📝 SQL: INSERT INTO time_records (user_id, date, time, type) VALUES (?, ?, ?, ?)
📝 Params: [ 2, '2025-12-05', '08:00:00', 'entry' ]
✅ Registro CRIADO. ID: 2
🔍 Verificação após INSERT: { id: 2, user_id: 2, date: '2025-12-05', time: '08:00:00', type: 'entry', ... }
📝 Atualizando status da solicitação para "approved"...
✅ Status atualizado. Changes: 1
🎉 APROVAÇÃO CONCLUÍDA COM SUCESSO!
```

**Se NÃO aparecer "✅ Registro CRIADO":**
- 🚨 INSERT está falhando
- 🚨 Verificar erro SQL no console

**Se aparecer "Changes: 0":**
- 🚨 UPDATE não encontrou a solicitação
- 🚨 Problema com o ID da solicitação

---

## 🐛 CENÁRIOS DE FALHA E DIAGNÓSTICO

### CENÁRIO 1: POST retorna sucesso, mas GET não encontra nada

**Possíveis causas:**
1. **Problema de timezone**
   - POST salva com data "2025-12-05"
   - GET busca com data "2025-12-06" (fuso diferente)
   - **Solução:** Forçar UTC em ambos

2. **Banco sendo resetado**
   - Setup está sendo chamado entre requisições
   - **Solução:** Verificar se `await setup()` está dentro de loop

3. **INSERT falha silenciosamente**
   - Callback de erro não está tratando
   - **Solução:** Verificar logs de erro

### CENÁRIO 2: GET encontra registros, mas frontend não atualiza

**Possíveis causas:**
1. **Frontend não chama loadTodayRecords()**
   - Verificar ClockIn.tsx linha 75
   - **Solução:** Garantir que `await loadTodayRecords()` está sendo executado

2. **Formato de resposta incorreto**
   - Frontend espera `entry`, backend retorna `entry_time`
   - **Solução:** Já corrigido (backend retorna `entry`)

3. **Estado não atualiza**
   - React não re-renderiza
   - **Solução:** Verificar setState

### CENÁRIO 3: Aprovação não cria registro

**Possíveis causas:**
1. **INSERT dentro de callback está falhando**
   - Verificar logs de erro
   - **Solução:** Logs já adicionados

2. **Dados da solicitação estão incorretos**
   - `request.new_time` está undefined
   - **Solução:** Verificar criação da solicitação

3. **Schema incompatível**
   - Tentando inserir em colunas que não existem
   - **Solução:** Usar rota /debug para verificar schema

---

## 📋 CHECKLIST DE VERIFICAÇÃO

### Antes de testar:
- [ ] Servidor rodou `await setup()` com sucesso
- [ ] Logs de reset do banco apareceram
- [ ] Admin foi criado (testeempresa@gmail.com)
- [ ] Porta 3000 está livre
- [ ] Build do frontend foi feito (`npm run build`)

### Durante o teste:
- [ ] Console do servidor está visível
- [ ] DevTools do navegador está aberto (F12)
- [ ] Tab Network está monitorando requests
- [ ] Tab Console está limpo de erros

### Após registrar ponto:
- [ ] Logs 🔵 [POST] aparecem no servidor
- [ ] INSERT foi executado com sucesso
- [ ] ID foi retornado (lastID)
- [ ] Verificação SELECT retornou o registro
- [ ] Total aumentou
- [ ] Logs 🟢 [GET] aparecem logo depois
- [ ] Registros foram encontrados (count > 0)
- [ ] Resposta final tem entry preenchido
- [ ] Frontend atualizou a lista

### Após aprovar ajuste:
- [ ] Logs 🟡 [PUT /approve] aparecem
- [ ] Solicitação foi encontrada
- [ ] Verificação de registro existente foi feita
- [ ] INSERT ou UPDATE foi executado
- [ ] Verificação após operação retornou dados
- [ ] Status foi atualizado (changes > 0)

---

## 🎯 PRÓXIMOS PASSOS

### Se TUDO funcionar nos logs mas não na tela:
➡️ Problema está no FRONTEND

**Investigar:**
1. ClockIn.tsx não está chamando loadTodayRecords()
2. Estado não está atualizando
3. Componente não está re-renderizando

### Se POST falha no INSERT:
➡️ Problema no SCHEMA do banco

**Investigar:**
1. Usar rota /debug para verificar schema
2. Verificar se colunas time e type existem
3. Verificar se há constraint impedindo INSERT

### Se GET não encontra registros:
➡️ Problema de SINCRONIA ou TIMEZONE

**Investigar:**
1. Comparar data usada no POST vs GET
2. Verificar se banco está sendo resetado
3. Usar rota /debug para ver registros reais

### Se aprovação não funciona:
➡️ Problema nos DADOS da solicitação

**Investigar:**
1. Verificar campos da tabela adjustment_requests
2. Verificar se new_time está vindo corretamente
3. Verificar se date e type estão corretos

---

## 🚨 COMANDOS ÚTEIS

### Inspecionar banco diretamente (SQLite CLI):
```bash
sqlite3 server/database.sqlite
.tables
.schema time_records
SELECT * FROM time_records;
SELECT * FROM time_records WHERE date = '2025-12-05';
.exit
```

### Limpar e reiniciar:
```bash
# Parar servidor (Ctrl+C)
rm server/database.sqlite
npm run start
```

### Ver logs em tempo real:
```bash
# Servidor já imprime automaticamente
# Não precisa usar tail -f
```

---

## 📊 RESULTADO ESPERADO

Se tudo estiver funcionando, você verá:

**No Console do Servidor:**
```
🔵 [POST /time-records] INÍCIO DO REGISTRO
✅ Registro INSERIDO com sucesso! ID: 1
🟢 [GET /today] BUSCA DE REGISTROS
📦 Registros encontrados no banco: 1
📤 Resposta final sendo enviada: { entry: "14:30:22", ... }
```

**No Frontend:**
- Lista "Batidas de Hoje" atualiza instantaneamente
- Entrada aparece em verde: 14:30:22
- Sem necessidade de F5

**Na rota /debug:**
```json
{
  "total_records": 1,
  "today_records": [
    { "id": 1, "user_id": 1, "date": "2025-12-05", "time": "14:30:22", "type": "entry" }
  ]
}
```

---

## ✅ CONFIRMAÇÃO DE CORREÇÕES

Após implementar logs e testar:

1. **ERRO 1 - Lista não atualiza:**
   - [ ] POST insere no banco (verificado com logs)
   - [ ] GET busca do banco (verificado com logs)
   - [ ] Resposta tem formato correto (entry não entry_time)
   - [ ] Frontend chama loadTodayRecords() após sucesso

2. **ERRO 2 - Aprovação não cria ponto:**
   - [ ] Solicitação é encontrada
   - [ ] INSERT ou UPDATE é executado
   - [ ] Registro aparece no banco (verificado com SELECT)
   - [ ] Status muda para "approved"

3. **ERRO 3 - Usuário Desconhecido:**
   - [ ] LEFT JOIN retorna user_name e user_email
   - [ ] Frontend mapeia para user.name
   - [ ] Cards mostram nome correto

---

**Este documento será atualizado conforme descobrimos a causa raiz dos problemas.**
