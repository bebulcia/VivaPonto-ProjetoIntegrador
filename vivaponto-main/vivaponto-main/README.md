# VivaPonto - Sistema de Controle de Ponto

Sistema profissional de controle de ponto eletrônico com backend Node.js + Express + SQLite e frontend React + Vite.

## Tecnologias

### Backend
- **Node.js** + **Express** - Servidor REST API
- **SQLite3** - Banco de dados local
- **JWT** - Autenticação e autorização
- **bcryptjs** - Criptografia de senhas

### Frontend
- **React** - Interface do usuário
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **TypeScript** - Tipagem estática

## Instalação

```bash
npm install
```

## Executar o Projeto

### Desenvolvimento (Hot Reload)

Execute frontend e backend simultaneamente com hot reload:

```bash
npm run dev
```

Acesse:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

### Produção

Build e execute o servidor (serve frontend e backend):

```bash
npm run start
```

Acesse: http://localhost:3000

Ou execute manualmente:

```bash
npm run build   # Build do frontend
npm run server  # Inicia apenas o backend
```

## Credenciais Padrão

**Administrador:**
- Email: `testeempresa@gmail.com`
- Senha: `teste`

## Estrutura do Banco de Dados

O banco de dados é criado automaticamente ao iniciar o servidor com índices otimizados para performance. (após executar o projeto o banco é resetado).

### Tabelas

#### users
- id, name, email, cpf, password, role (admin/employee), shift_id
- **Índice:** cpf (otimiza buscas por CPF)

#### shifts
- id, name, start_time, break_start, break_end, end_time, total_minutes

#### time_records
- id, user_id, date, time, type (entry/break_start/break_end/exit)
- edited_by_admin, admin_id, admin_justification, edited_at (auditoria)
- **Índice:** (user_id, date) - otimiza consultas de registros por funcionário/data

#### adjustment_requests
- id, user_id, date, old_time, new_time, type, reason, status, reviewed_by, reviewed_at
- **Índice:** (user_id, status) - otimiza filtros de solicitações

#### user_shift_history
- id, user_id, shift_id, start_date, end_date
- **Índice:** user_id - rastreia mudanças de turno ao longo do tempo

## Funcionalidades Globais

---

## Funcionalidades

### Administrador

1. **Dashboard** - Visão geral do sistema
   - Total de funcionários
   - Solicitações pendentes com badge de notificação
   - Funcionários presentes hoje
   - Ferramentas de desenvolvimento (gerar dados de teste)

2. **Gestão de Turnos**
   - Criar/editar turnos de trabalho
   - Definir 4 horários (Entrada, Saída Almoço, Retorno, Saída)
   - Cálculo automático de carga horária
   - Histórico automático de mudanças de turno

3. **Gestão de Funcionários**
   - Cadastrar funcionários (Nome, Email, CPF, Senha, Turno)
   - Listar todos os funcionários
   - Editar funcionários (registra histórico de turno)
   - Excluir funcionários

4. **Central de Solicitações**
   - Badge vermelho com contador de pendências
   - Aprovar/Rejeitar ajustes de ponto
   - Filtrar por status (Pendente, Aprovado, Rejeitado)

5. **Relatórios Avançados**
   - Filtrar por funcionário e período
   - Visualizar horas trabalhadas vs horas previstas
   - Saldo de horas (extras em verde, negativas em vermelho)

6. **Ajustes Manuais** (NOVO)
   - Adicionar batida manual com justificativa obrigatória
   - Editar batidas existentes com auditoria completa
   - Excluir batidas com registro de justificativa
   - Indicador visual de batidas editadas pelo admin
   - Filtro por funcionário e data

7. **Cartão de Ponto** (NOVO)
   - Relatório mensal completo por funcionário
   - Tabela com todas as batidas do mês
   - Cálculo de saldo diário e total
   - Botão de impressão profissional
   - CSS otimizado para impressão em A4
   - Remove fundos escuros e adapta cores para papel
   - Filtro por funcionário e mês/ano

### Funcionário

O painel do funcionário possui **menu de navegação** (igual ao admin) com 3 seções:

#### 1. **Registrar Ponto** (Página Inicial)
   - Relógio em tempo real (data e hora)
   - Botão grande para registrar ponto (determina automaticamente: Entrada → Pausa → Retorno → Saída)
   - "Batidas de Hoje" em tempo real logo abaixo do botão
   - Ícones coloridos: 🟢 Entrada | 🟡 Pausa | 🟠 Retorno | 🔴 Saída
   - Validação: não permite registro duplicado

#### 2. **Relatórios**
   - Filtro de período (7, 15 ou 30 dias)
   - Tabela completa: Data | Entrada | Pausa | Retorno | Saída | Horas Trabalhadas | Saldo
   - Cálculo automático validado (sem NaN)
   - Saldo em **verde** (extras) ou **vermelho** (déficit)
   - Exibe turno e jornada esperada

#### 3. **Solicitações de Ajuste**
   - Formulário para solicitar correção de ponto
   - Campos: Data, Tipo, Horário Correto, Motivo
   - Lista de "Minhas Solicitações" com status visual:
     - 🕒 Pendente (amarelo)
     - ✅ Aprovado (verde)
     - ❌ Recusado (vermelho)
   - Histórico completo de solicitações

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Cadastro de usuário

### Usuários
- `GET /api/users` - Listar funcionários (Admin)
- `GET /api/users/me` - Dados do usuário logado
- `GET /api/users/stats` - Estatísticas (Admin)
- `DELETE /api/users/:id` - Excluir funcionário (Admin)

### Turnos
- `GET /api/shifts` - Listar turnos
- `POST /api/shifts` - Criar turno (Admin)
- `PUT /api/shifts/:id` - Atualizar turno (Admin)
- `DELETE /api/shifts/:id` - Excluir turno (Admin)

### Registros de Ponto
- `GET /api/time-records` - Listar registros
- `GET /api/time-records/today` - Registros de hoje
- `POST /api/time-records` - Registrar ponto
- `GET /api/time-records/report` - Relatório de horas

### Solicitações de Ajuste
- `GET /api/adjustment-requests` - Listar solicitações
- `POST /api/adjustment-requests` - Criar solicitação
- `PUT /api/adjustment-requests/:id/approve` - Aprovar (Admin)
- `PUT /api/adjustment-requests/:id/reject` - Rejeitar (Admin)

### Ajustes Manuais (Admin)
- `GET /api/manual/records/:userId/:date` - Buscar batidas do dia
- `POST /api/manual/add` - Adicionar batida manual
- `PUT /api/manual/edit/:id` - Editar batida
- `DELETE /api/manual/delete/:id` - Excluir batida

### Debug (Desenvolvimento)
- `POST /api/debug/seed-scenarios` - Gerar dados de teste

## Build para Produção

```bash
npm run build
```

Os arquivos compilados estarão em `dist/`.

## Segurança

- Senhas criptografadas com bcrypt
- Autenticação JWT com expiração de 7 dias
- Middleware de proteção de rotas
- Validação de dados em todas as requisições
- CORS configurado
- SQL Injection protegido (prepared statements)

## Desenvolvimento

O projeto está configurado com:
- Hot reload no frontend (Vite)
- Proxy automático `/api` → `http://localhost:3000`
- TypeScript para tipagem estática