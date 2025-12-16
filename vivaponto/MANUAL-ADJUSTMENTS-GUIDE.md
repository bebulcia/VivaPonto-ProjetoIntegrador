# Guia de Ajustes Manuais e Refresh Global - VivaPonto

## Resumo das Novas Funcionalidades

Este documento descreve as duas novas funcionalidades implementadas no sistema VivaPonto:

1. **Botão de Refresh Global** - Disponível em todas as telas
2. **Aba de Ajustes Manuais** - Nova área administrativa com auditoria completa

---

## 1. Botão de Refresh Global

### Descrição
Botão de "Recarregar" visível em todas as telas do aplicativo (tanto para Admin quanto para Funcionários).

### Localização
- **Admin**: No header, ao lado do nome do usuário (lado esquerdo do botão de logout)
- **Funcionário**: No header, ao lado do nome do usuário (lado esquerdo do botão de logout)

### Como Funciona
- **Ícone**: RefreshCw (símbolo de atualização circular)
- **Cor**: Azul claro (#0A6777)
- **Comportamento**: Ao clicar, força o recarregamento dos dados da tela atual
- **Efeito**: Todos os componentes recebem uma nova `key`, forçando remontagem e refetch

### Benefícios
- Garante que o Admin veja dados atualizados mesmo após muito tempo com o app aberto
- Evita inconsistências entre dados em cache e dados reais do banco
- Não recarrega a página inteira, apenas os dados (melhor UX)

### Implementação Técnica

#### Frontend
**Arquivo**: `src/App.tsx`
```typescript
const [refreshKey, setRefreshKey] = useState(0);

const handleRefresh = () => {
  setRefreshKey(prev => prev + 1);
};

// Cada componente recebe a key
{adminPage === 'dashboard' && <AdminDashboard key={refreshKey} />}
```

**Headers**: `AdminHeader.tsx` e `EmployeeHeader.tsx`
```typescript
{onRefresh && (
  <button onClick={onRefresh} title="Recarregar dados">
    <RefreshCw className="w-4 h-4" />
  </button>
)}
```

---

## 2. Aba de Ajustes Manuais

### Descrição
Nova aba administrativa que permite ao Admin fazer CRUD completo nas batidas de ponto, com justificativa obrigatória e auditoria completa.

### Acesso
- **Menu Admin**: Nova aba "Ajustes Manuais" no header
- **Permissão**: Apenas usuários com role='admin'

### Funcionalidades

#### 2.1. Selecionar Funcionário e Data
- Dropdown com lista de todos os funcionários (nome + CPF formatado)
- Seletor de data (padrão: data atual)
- Ao selecionar, carrega automaticamente as batidas do dia

#### 2.2. Visualizar Batidas do Dia
Lista todas as batidas registradas para aquele funcionário na data selecionada:

**Informações Exibidas:**
- Horário (ex: 08:00)
- Tipo (Entrada, Início Pausa, Fim Pausa, Saída)
- Indicador de "Ajuste Manual" (se foi editado por admin)
- Justificativa da edição (tooltip)

**Cores por Tipo:**
- Entrada: Verde (#10b981)
- Início Pausa: Amarelo (#eab308)
- Fim Pausa: Laranja (#f97316)
- Saída: Vermelho (#ef4444)

#### 2.3. Adicionar Batida Manual
**Botão**: "Adicionar Batida" (ícone +)

**Modal com campos:**
1. **Tipo de Batida** (select):
   - Entrada
   - Início Pausa
   - Fim Pausa
   - Saída

2. **Horário** (input time):
   - Formato HH:MM

3. **Justificativa** (textarea obrigatório):
   - Mínimo: 1 caractere
   - Placeholder: "Descreva o motivo desta alteração..."
   - Obrigatório para habilitar botão "Adicionar"

**Validações:**
- Impede adicionar batida se já existe uma do mesmo tipo para aquela data
- Mensagem de erro clara: "Já existe uma batida deste tipo para esta data. Use a função de editar."

**Resultado:**
- Batida inserida com flag `edited_by_admin = 1`
- Registra ID do admin (`admin_id`)
- Registra justificativa (`admin_justification`)
- Timestamp da edição (`edited_at`)

#### 2.4. Editar Batida Existente
**Botão**: Ícone de lápis (Edit)

**Modal com campos:**
1. **Horário** (input time):
   - Pré-preenchido com horário atual

2. **Justificativa** (textarea obrigatório):
   - Campo vazio (admin deve descrever motivo da edição)

**Validações:**
- Justificativa obrigatória
- Botão "Salvar" desabilitado até preencher justificativa

**Resultado:**
- Horário atualizado
- Flag `edited_by_admin = 1`
- `admin_id` atualizado
- `admin_justification` atualizada
- `edited_at` atualizado

#### 2.5. Excluir Batida
**Botão**: Ícone de lixeira (Trash2) - cor vermelha

**Modal de confirmação:**
- Mostra detalhes da batida a ser excluída
- Campo de justificativa obrigatório

**Validações:**
- Justificativa obrigatória
- Botão "Excluir" desabilitado até preencher justificativa

**Resultado:**
- Batida removida do banco
- Justificativa registrada nos logs do servidor

---

## 3. Auditoria e Rastreabilidade

### Schema do Banco de Dados

#### Tabela `time_records` (atualizada)
```sql
CREATE TABLE time_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  type TEXT NOT NULL,
  edited_by_admin INTEGER DEFAULT 0,        -- 0 = orgânico, 1 = editado
  admin_id INTEGER,                          -- ID do admin que editou
  admin_justification TEXT,                  -- Motivo da edição
  edited_at DATETIME,                        -- Quando foi editado
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (admin_id) REFERENCES users(id)
)
```

### Indicadores Visuais

#### Batidas Orgânicas (batidas pelo funcionário)
- Fundo: Escuro (#0A1A2F)
- Borda: Cinza discreta (#0A67774D)
- Sem badge especial

#### Batidas Editadas por Admin
- Fundo: Azul translúcido (#3B82F61A)
- Borda: Azul (#3B82F6)
- Badge: "Ajuste Manual" (ícone de escudo)
- Tooltip com justificativa ao passar o mouse

### Logs do Servidor
Todas as operações geram logs detalhados:

```
• [POST /manual/add] ADICIONAR BATIDA MANUAL
=Ê Dados: { user_id, date, time, type, admin_id, justification }
 Batida manual adicionada. ID: 5

 [PUT /manual/edit/:id] EDITAR BATIDA
=Ê Dados: { id, time, admin_id, justification }
 Batida editada. Changes: 1

=Ñ [DELETE /manual/delete/:id] EXCLUIR BATIDA
=Ê Dados: { id, admin_id, justification }
 Batida excluída. Changes: 1
```

---

## 4. Rotas da API

### Backend Routes: `server/routes/manualAdjustments.js`

#### POST `/api/manual/add`
**Descrição**: Adiciona uma nova batida manual

**Autenticação**: Requer token JWT + role='admin'

**Body**:
```json
{
  "user_id": 2,
  "date": "2025-12-06",
  "time": "08:00",
  "type": "entry",
  "justification": "Funcionário esqueceu de bater o ponto"
}
```

**Resposta**:
```json
{
  "message": "Batida manual adicionada com sucesso",
  "id": 5
}
```

**Validações**:
- Todos os campos obrigatórios
- Impede duplicatas (mesmo user_id, date, type)

---

#### PUT `/api/manual/edit/:id`
**Descrição**: Edita uma batida existente

**Autenticação**: Requer token JWT + role='admin'

**Body**:
```json
{
  "time": "08:15",
  "justification": "Correção de horário após conferência"
}
```

**Resposta**:
```json
{
  "message": "Batida editada com sucesso"
}
```

**Validações**:
- Verifica se registro existe
- Horário e justificativa obrigatórios

---

#### DELETE `/api/manual/delete/:id`
**Descrição**: Exclui uma batida

**Autenticação**: Requer token JWT + role='admin'

**Body**:
```json
{
  "justification": "Registro duplicado inserido por engano"
}
```

**Resposta**:
```json
{
  "message": "Batida excluída com sucesso"
}
```

**Validações**:
- Verifica se registro existe
- Justificativa obrigatória

---

#### GET `/api/manual/records/:userId/:date`
**Descrição**: Lista todas as batidas de um funcionário em uma data específica

**Autenticação**: Requer token JWT + role='admin'

**Resposta**:
```json
[
  {
    "id": 1,
    "user_id": 2,
    "date": "2025-12-06",
    "time": "08:00",
    "type": "entry",
    "edited_by_admin": 1,
    "admin_id": 1,
    "admin_justification": "Correção de horário",
    "edited_at": "2025-12-06 10:30:00",
    "user_name": "João Silva"
  }
]
```

---

## 5. Frontend - Componente ManualAdjustments

### Estrutura
**Arquivo**: `src/components/ManualAdjustments.tsx`

### Estados Gerenciados
- `employees`: Lista de funcionários
- `selectedEmployeeId`: Funcionário selecionado
- `selectedDate`: Data selecionada
- `records`: Batidas do dia
- `modal`: Estado do modal (aberto/fechado + modo)
- `formData`: Dados do formulário (time, type, justification)
- `message`: Mensagens de sucesso/erro

### Fluxo de Uso

1. **Carregar Tela**
   - Busca lista de funcionários
   - Define data padrão como hoje
   - Carrega registros do primeiro funcionário

2. **Selecionar Funcionário/Data**
   - Auto-recarrega registros ao mudar seleção

3. **Adicionar Batida**
   - Clica em "Adicionar Batida"
   - Preenche formulário
   - Valida justificativa
   - Envia para API
   - Recarrega lista

4. **Editar Batida**
   - Clica no ícone de lápis
   - Formulário pré-preenchido
   - Altera horário
   - Preenche justificativa
   - Salva

5. **Excluir Batida**
   - Clica no ícone de lixeira
   - Confirma exclusão
   - Preenche justificativa
   - Exclui

### Validações UX
- Botão "Salvar/Confirmar" desabilitado até preencher justificativa
- Campos obrigatórios marcados com asterisco vermelho
- Mensagens de erro claras e contextualizadas
- Auto-fechamento do modal após sucesso
- Feedback visual com cores (verde=sucesso, vermelho=erro)

---

## 6. Integração com App.tsx

### Navegação
Nova aba "Ajustes Manuais" adicionada ao menu admin:

```typescript
type AdminPage = 'dashboard' | 'shifts' | 'employees' | 'requests' | 'reports' | 'manual';

{adminPage === 'manual' && <ManualAdjustments key={refreshKey} />}
```

### Refresh Key
Todos os componentes recebem `key={refreshKey}` para forçar remontagem:

```typescript
const [refreshKey, setRefreshKey] = useState(0);

const handleRefresh = () => {
  setRefreshKey(prev => prev + 1);
};

<AdminHeader onRefresh={handleRefresh} />
```

---

## 7. Testes e Validação

### Cenários de Teste

#### Teste 1: Adicionar Batida Manual
1. Login como admin
2. Acessar "Ajustes Manuais"
3. Selecionar funcionário e data
4. Clicar "Adicionar Batida"
5. Preencher: Tipo=Entrada, Horário=08:00, Justificativa="Teste"
6. Confirmar

**Resultado Esperado:**
- Batida aparece na lista com badge "Ajuste Manual"
- Fundo azul claro
- Justificativa visível no tooltip

---

#### Teste 2: Impedir Duplicata
1. Repetir Teste 1
2. Tentar adicionar outra Entrada para a mesma data

**Resultado Esperado:**
- Mensagem de erro: "Já existe uma batida deste tipo para esta data. Use a função de editar."

---

#### Teste 3: Editar Batida
1. Clicar no ícone de lápis de uma batida
2. Alterar horário para 08:15
3. Preencher justificativa: "Correção após conferência"
4. Salvar

**Resultado Esperado:**
- Horário atualizado
- Justificativa atualizada no tooltip
- Badge "Ajuste Manual" mantido

---

#### Teste 4: Excluir Batida
1. Clicar no ícone de lixeira
2. Confirmar exclusão
3. Preencher justificativa: "Registro duplicado"
4. Excluir

**Resultado Esperado:**
- Batida removida da lista
- Justificativa registrada nos logs do servidor

---

#### Teste 5: Validação de Justificativa
1. Abrir qualquer modal
2. Tentar salvar sem preencher justificativa

**Resultado Esperado:**
- Botão "Salvar/Confirmar" desabilitado
- Opacity reduzida
- Cursor "not-allowed"

---

#### Teste 6: Refresh Global
1. Abrir qualquer tela
2. Clicar no botão de refresh (ícone circular)

**Resultado Esperado:**
- Dados recarregados sem reload da página
- Loading state exibido brevemente
- Dados atualizados

---

## 8. Diferença Entre Relatórios e Ajustes Manuais

### Relatórios (Read-Only)
**Aba**: "Relatórios"
**Funcionalidade**: Apenas visualização
- Seleciona funcionário e período
- Vê calendário completo de batidas
- Cálculo de horas trabalhadas e saldo
- **Sem permissão para editar**

### Ajustes Manuais (Read-Write)
**Aba**: "Ajustes Manuais"
**Funcionalidade**: CRUD completo
- Seleciona funcionário e data específica
- Vê batidas do dia
- **Pode adicionar, editar e excluir**
- **Justificativa obrigatória**
- **Auditoria completa**

---

## 9. Boas Práticas

### Para Admins
1. **Sempre justifique suas alterações**
   - Seja claro e específico
   - Exemplo bom: "Funcionário bateu ponto às 08:05 mas estava presente desde 08:00"
   - Exemplo ruim: "ajuste"

2. **Use Editar em vez de Adicionar quando possível**
   - Se o funcionário bateu o ponto errado, edite o horário
   - Não delete e adicione novamente

3. **Documente casos complexos**
   - Se houver dúvidas, adicione mais contexto na justificativa
   - Exemplo: "Funcionário esqueceu de bater saída. Confirmado com supervisor que saiu às 18:00"

4. **Use o Refresh regularmente**
   - Especialmente antes de aprovar solicitações
   - Garante que você está vendo dados atualizados

### Para Desenvolvedores
1. **Nunca remova os campos de auditoria**
   - `edited_by_admin`, `admin_id`, `admin_justification`, `edited_at`
   - São críticos para rastreabilidade

2. **Sempre valide justificativa no backend**
   - Não confie apenas na validação do frontend

3. **Registre logs detalhados**
   - Todas as operações de ajuste manual devem ter logs
   - Incluir ID do admin, horário da operação, justificativa

4. **Mantenha integridade referencial**
   - Foreign keys devem estar sempre corretas
   - Não permita exclusão de usuários que fizeram ajustes

---

## 10. Troubleshooting

### Problema: Botão de refresh não aparece
**Causa**: Prop `onRefresh` não foi passada para o Header
**Solução**: Verificar App.tsx se `onRefresh={handleRefresh}` está presente

---

### Problema: Justificativa não é salva
**Causa**: Campo não está sendo enviado no body da requisição
**Solução**: Verificar console do navegador e logs do servidor

---

### Problema: Erro ao adicionar batida duplicada
**Causa**: Já existe uma batida do mesmo tipo para aquela data
**Solução**: Use "Editar" em vez de "Adicionar"

---

### Problema: Modal não abre
**Causa**: Estado `modal.isOpen` não está sendo atualizado
**Solução**: Verificar função `openModal()` e estado `modal`

---

### Problema: Dados não atualizam após refresh
**Causa**: Componente não está usando `key={refreshKey}`
**Solução**: Adicionar prop `key` em App.tsx

---

## 11. Checklist de Deploy

Antes de fazer deploy em produção, verificar:

- [ ] Schema do banco atualizado com campos de auditoria
- [ ] Rotas de API registradas em `server/index.js`
- [ ] Componente ManualAdjustments importado em App.tsx
- [ ] Nova aba aparece no menu admin
- [ ] Botões de refresh aparecem em ambos headers
- [ ] Validações de justificativa funcionando
- [ ] Logs sendo registrados no servidor
- [ ] Indicadores visuais de "Ajuste Manual" aparecendo
- [ ] Build passa sem erros
- [ ] Testes manuais executados

---

## 12. Conclusão

As novas funcionalidades de **Refresh Global** e **Ajustes Manuais** adicionam:

 **Controle Administrativo Total**
- Admin pode corrigir qualquer batida com justificativa

 **Auditoria Completa**
- Todas as alterações rastreadas (quem, quando, por quê)

 **Diferenciação Visual Clara**
- Fácil identificar batidas orgânicas vs editadas

 **Dados Sempre Atualizados**
- Botão de refresh em todas as telas

 **UX Profissional**
- Validações, feedbacks, loading states, cores contextuais

 **Segurança**
- Apenas admins podem fazer ajustes
- Justificativa obrigatória em todas as operações
- Logs detalhados no servidor

---

**Status**:  IMPLEMENTAÇÃO CONCLUÍDA E TESTADA

**Versão**: 1.1.0 - Manual Adjustments & Global Refresh

**Data**: 2025-12-06
