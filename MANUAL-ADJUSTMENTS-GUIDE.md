# Guia de Ajustes Manuais e Refresh Global - VivaPonto

## Resumo das Novas Funcionalidades

Este documento descreve as duas novas funcionalidades implementadas no sistema VivaPonto:

1. **Bot�o de Refresh Global** - Dispon�vel em todas as telas
2. **Aba de Ajustes Manuais** - Nova �rea administrativa com auditoria completa

---

## 1. Bot�o de Refresh Global

### Descri��o
Bot�o de "Recarregar" vis�vel em todas as telas do aplicativo (tanto para Admin quanto para Funcion�rios).

### Localiza��o
- **Admin**: No header, ao lado do nome do usu�rio (lado esquerdo do bot�o de logout)
- **Funcion�rio**: No header, ao lado do nome do usu�rio (lado esquerdo do bot�o de logout)

### Como Funciona
- **�cone**: RefreshCw (s�mbolo de atualiza��o circular)
- **Cor**: Azul claro (#0A6777)
- **Comportamento**: Ao clicar, for�a o recarregamento dos dados da tela atual
- **Efeito**: Todos os componentes recebem uma nova `key`, for�ando remontagem e refetch

### Benef�cios
- Garante que o Admin veja dados atualizados mesmo ap�s muito tempo com o app aberto
- Evita inconsist�ncias entre dados em cache e dados reais do banco
- N�o recarrega a p�gina inteira, apenas os dados (melhor UX)

### Implementa��o T�cnica

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

### Descri��o
Nova aba administrativa que permite ao Admin fazer CRUD completo nas batidas de ponto, com justificativa obrigat�ria e auditoria completa.

### Acesso
- **Menu Admin**: Nova aba "Ajustes Manuais" no header
- **Permiss�o**: Apenas usu�rios com role='admin'

### Funcionalidades

#### 2.1. Selecionar Funcion�rio e Data
- Dropdown com lista de todos os funcion�rios (nome + CPF formatado)
- Seletor de data (padr�o: data atual)
- Ao selecionar, carrega automaticamente as batidas do dia

#### 2.2. Visualizar Batidas do Dia
Lista todas as batidas registradas para aquele funcion�rio na data selecionada:

**Informa��es Exibidas:**
- Hor�rio (ex: 08:00)
- Tipo (Entrada, In�cio Pausa, Fim Pausa, Sa�da)
- Indicador de "Ajuste Manual" (se foi editado por admin)
- Justificativa da edi��o (tooltip)

**Cores por Tipo:**
- Entrada: Verde (#10b981)
- In�cio Pausa: Amarelo (#eab308)
- Fim Pausa: Laranja (#f97316)
- Sa�da: Vermelho (#ef4444)

#### 2.3. Adicionar Batida Manual
**Bot�o**: "Adicionar Batida" (�cone +)

**Modal com campos:**
1. **Tipo de Batida** (select):
   - Entrada
   - In�cio Pausa
   - Fim Pausa
   - Sa�da

2. **Hor�rio** (input time):
   - Formato HH:MM

3. **Justificativa** (textarea obrigat�rio):
   - M�nimo: 1 caractere
   - Placeholder: "Descreva o motivo desta altera��o..."
   - Obrigat�rio para habilitar bot�o "Adicionar"

**Valida��es:**
- Impede adicionar batida se j� existe uma do mesmo tipo para aquela data
- Mensagem de erro clara: "J� existe uma batida deste tipo para esta data. Use a fun��o de editar."

**Resultado:**
- Batida inserida com flag `edited_by_admin = 1`
- Registra ID do admin (`admin_id`)
- Registra justificativa (`admin_justification`)
- Timestamp da edi��o (`edited_at`)

#### 2.4. Editar Batida Existente
**Bot�o**: �cone de l�pis (Edit)

**Modal com campos:**
1. **Hor�rio** (input time):
   - Pr�-preenchido com hor�rio atual

2. **Justificativa** (textarea obrigat�rio):
   - Campo vazio (admin deve descrever motivo da edi��o)

**Valida��es:**
- Justificativa obrigat�ria
- Bot�o "Salvar" desabilitado at� preencher justificativa

**Resultado:**
- Hor�rio atualizado
- Flag `edited_by_admin = 1`
- `admin_id` atualizado
- `admin_justification` atualizada
- `edited_at` atualizado

#### 2.5. Excluir Batida
**Bot�o**: �cone de lixeira (Trash2) - cor vermelha

**Modal de confirma��o:**
- Mostra detalhes da batida a ser exclu�da
- Campo de justificativa obrigat�rio

**Valida��es:**
- Justificativa obrigat�ria
- Bot�o "Excluir" desabilitado at� preencher justificativa

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
  edited_by_admin INTEGER DEFAULT 0,        -- 0 = org�nico, 1 = editado
  admin_id INTEGER,                          -- ID do admin que editou
  admin_justification TEXT,                  -- Motivo da edi��o
  edited_at DATETIME,                        -- Quando foi editado
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (admin_id) REFERENCES users(id)
)
```

### Indicadores Visuais

#### Batidas Org�nicas (batidas pelo funcion�rio)
- Fundo: Escuro (#0A1A2F)
- Borda: Cinza discreta (#0A67774D)
- Sem badge especial

#### Batidas Editadas por Admin
- Fundo: Azul transl�cido (#3B82F61A)
- Borda: Azul (#3B82F6)
- Badge: "Ajuste Manual" (�cone de escudo)
- Tooltip com justificativa ao passar o mouse

### Logs do Servidor
Todas as opera��es geram logs detalhados:

```
� [POST /manual/add] ADICIONAR BATIDA MANUAL
=� Dados: { user_id, date, time, type, admin_id, justification }
 Batida manual adicionada. ID: 5

 [PUT /manual/edit/:id] EDITAR BATIDA
=� Dados: { id, time, admin_id, justification }
 Batida editada. Changes: 1

=� [DELETE /manual/delete/:id] EXCLUIR BATIDA
=� Dados: { id, admin_id, justification }
 Batida exclu�da. Changes: 1
```

---

## 4. Rotas da API

### Backend Routes: `server/routes/manualAdjustments.js`

#### POST `/api/manual/add`
**Descri��o**: Adiciona uma nova batida manual

**Autentica��o**: Requer token JWT + role='admin'

**Body**:
```json
{
  "user_id": 2,
  "date": "2025-12-06",
  "time": "08:00",
  "type": "entry",
  "justification": "Funcion�rio esqueceu de bater o ponto"
}
```

**Resposta**:
```json
{
  "message": "Batida manual adicionada com sucesso",
  "id": 5
}
```

**Valida��es**:
- Todos os campos obrigat�rios
- Impede duplicatas (mesmo user_id, date, type)

---

#### PUT `/api/manual/edit/:id`
**Descri��o**: Edita uma batida existente

**Autentica��o**: Requer token JWT + role='admin'

**Body**:
```json
{
  "time": "08:15",
  "justification": "Corre��o de hor�rio ap�s confer�ncia"
}
```

**Resposta**:
```json
{
  "message": "Batida editada com sucesso"
}
```

**Valida��es**:
- Verifica se registro existe
- Hor�rio e justificativa obrigat�rios

---

#### DELETE `/api/manual/delete/:id`
**Descri��o**: Exclui uma batida

**Autentica��o**: Requer token JWT + role='admin'

**Body**:
```json
{
  "justification": "Registro duplicado inserido por engano"
}
```

**Resposta**:
```json
{
  "message": "Batida exclu�da com sucesso"
}
```

**Valida��es**:
- Verifica se registro existe
- Justificativa obrigat�ria

---

#### GET `/api/manual/records/:userId/:date`
**Descri��o**: Lista todas as batidas de um funcion�rio em uma data espec�fica

**Autentica��o**: Requer token JWT + role='admin'

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
    "admin_justification": "Corre��o de hor�rio",
    "edited_at": "2025-12-06 10:30:00",
    "user_name": "Jo�o Silva"
  }
]
```

---

## 5. Frontend - Componente ManualAdjustments

### Estrutura
**Arquivo**: `src/components/ManualAdjustments.tsx`

### Estados Gerenciados
- `employees`: Lista de funcion�rios
- `selectedEmployeeId`: Funcion�rio selecionado
- `selectedDate`: Data selecionada
- `records`: Batidas do dia
- `modal`: Estado do modal (aberto/fechado + modo)
- `formData`: Dados do formul�rio (time, type, justification)
- `message`: Mensagens de sucesso/erro

### Fluxo de Uso

1. **Carregar Tela**
   - Busca lista de funcion�rios
   - Define data padr�o como hoje
   - Carrega registros do primeiro funcion�rio

2. **Selecionar Funcion�rio/Data**
   - Auto-recarrega registros ao mudar sele��o

3. **Adicionar Batida**
   - Clica em "Adicionar Batida"
   - Preenche formul�rio
   - Valida justificativa
   - Envia para API
   - Recarrega lista

4. **Editar Batida**
   - Clica no �cone de l�pis
   - Formul�rio pr�-preenchido
   - Altera hor�rio
   - Preenche justificativa
   - Salva

5. **Excluir Batida**
   - Clica no �cone de lixeira
   - Confirma exclus�o
   - Preenche justificativa
   - Exclui

### Valida��es UX
- Bot�o "Salvar/Confirmar" desabilitado at� preencher justificativa
- Campos obrigat�rios marcados com asterisco vermelho
- Mensagens de erro claras e contextualizadas
- Auto-fechamento do modal ap�s sucesso
- Feedback visual com cores (verde=sucesso, vermelho=erro)

---

## 6. Integra��o com App.tsx

### Navega��o
Nova aba "Ajustes Manuais" adicionada ao menu admin:

```typescript
type AdminPage = 'dashboard' | 'shifts' | 'employees' | 'requests' | 'reports' | 'manual';

{adminPage === 'manual' && <ManualAdjustments key={refreshKey} />}
```

### Refresh Key
Todos os componentes recebem `key={refreshKey}` para for�ar remontagem:

```typescript
const [refreshKey, setRefreshKey] = useState(0);

const handleRefresh = () => {
  setRefreshKey(prev => prev + 1);
};

<AdminHeader onRefresh={handleRefresh} />
```

---

## 7. Testes e Valida��o

### Cen�rios de Teste

#### Teste 1: Adicionar Batida Manual
1. Login como admin
2. Acessar "Ajustes Manuais"
3. Selecionar funcion�rio e data
4. Clicar "Adicionar Batida"
5. Preencher: Tipo=Entrada, Hor�rio=08:00, Justificativa="Teste"
6. Confirmar

**Resultado Esperado:**
- Batida aparece na lista com badge "Ajuste Manual"
- Fundo azul claro
- Justificativa vis�vel no tooltip

---

#### Teste 2: Impedir Duplicata
1. Repetir Teste 1
2. Tentar adicionar outra Entrada para a mesma data

**Resultado Esperado:**
- Mensagem de erro: "J� existe uma batida deste tipo para esta data. Use a fun��o de editar."

---

#### Teste 3: Editar Batida
1. Clicar no �cone de l�pis de uma batida
2. Alterar hor�rio para 08:15
3. Preencher justificativa: "Corre��o ap�s confer�ncia"
4. Salvar

**Resultado Esperado:**
- Hor�rio atualizado
- Justificativa atualizada no tooltip
- Badge "Ajuste Manual" mantido

---

#### Teste 4: Excluir Batida
1. Clicar no �cone de lixeira
2. Confirmar exclus�o
3. Preencher justificativa: "Registro duplicado"
4. Excluir

**Resultado Esperado:**
- Batida removida da lista
- Justificativa registrada nos logs do servidor

---

#### Teste 5: Valida��o de Justificativa
1. Abrir qualquer modal
2. Tentar salvar sem preencher justificativa

**Resultado Esperado:**
- Bot�o "Salvar/Confirmar" desabilitado
- Opacity reduzida
- Cursor "not-allowed"

---

#### Teste 6: Refresh Global
1. Abrir qualquer tela
2. Clicar no bot�o de refresh (�cone circular)

**Resultado Esperado:**
- Dados recarregados sem reload da p�gina
- Loading state exibido brevemente
- Dados atualizados

---

## 8. Diferen�a Entre Relat�rios e Ajustes Manuais

### Relat�rios (Read-Only)
**Aba**: "Relat�rios"
**Funcionalidade**: Apenas visualiza��o
- Seleciona funcion�rio e per�odo
- V� calend�rio completo de batidas
- C�lculo de horas trabalhadas e saldo
- **Sem permiss�o para editar**

### Ajustes Manuais (Read-Write)
**Aba**: "Ajustes Manuais"
**Funcionalidade**: CRUD completo
- Seleciona funcion�rio e data espec�fica
- V� batidas do dia
- **Pode adicionar, editar e excluir**
- **Justificativa obrigat�ria**
- **Auditoria completa**

---

## 9. Boas Pr�ticas

### Para Admins
1. **Sempre justifique suas altera��es**
   - Seja claro e espec�fico
   - Exemplo bom: "Funcion�rio bateu ponto �s 08:05 mas estava presente desde 08:00"
   - Exemplo ruim: "ajuste"

2. **Use Editar em vez de Adicionar quando poss�vel**
   - Se o funcion�rio bateu o ponto errado, edite o hor�rio
   - N�o delete e adicione novamente

3. **Documente casos complexos**
   - Se houver d�vidas, adicione mais contexto na justificativa
   - Exemplo: "Funcion�rio esqueceu de bater sa�da. Confirmado com supervisor que saiu �s 18:00"

4. **Use o Refresh regularmente**
   - Especialmente antes de aprovar solicita��es
   - Garante que voc� est� vendo dados atualizados

### Para Desenvolvedores
1. **Nunca remova os campos de auditoria**
   - `edited_by_admin`, `admin_id`, `admin_justification`, `edited_at`
   - S�o cr�ticos para rastreabilidade

2. **Sempre valide justificativa no backend**
   - N�o confie apenas na valida��o do frontend

3. **Registre logs detalhados**
   - Todas as opera��es de ajuste manual devem ter logs
   - Incluir ID do admin, hor�rio da opera��o, justificativa

4. **Mantenha integridade referencial**
   - Foreign keys devem estar sempre corretas
   - N�o permita exclus�o de usu�rios que fizeram ajustes

---

## 10. Troubleshooting

### Problema: Bot�o de refresh n�o aparece
**Causa**: Prop `onRefresh` n�o foi passada para o Header
**Solu��o**: Verificar App.tsx se `onRefresh={handleRefresh}` est� presente

---

### Problema: Justificativa n�o � salva
**Causa**: Campo n�o est� sendo enviado no body da requisi��o
**Solu��o**: Verificar console do navegador e logs do servidor

---

### Problema: Erro ao adicionar batida duplicada
**Causa**: J� existe uma batida do mesmo tipo para aquela data
**Solu��o**: Use "Editar" em vez de "Adicionar"

---

### Problema: Modal n�o abre
**Causa**: Estado `modal.isOpen` n�o est� sendo atualizado
**Solu��o**: Verificar fun��o `openModal()` e estado `modal`

---

### Problema: Dados n�o atualizam ap�s refresh
**Causa**: Componente n�o est� usando `key={refreshKey}`
**Solu��o**: Adicionar prop `key` em App.tsx

---

## 11. Checklist de Deploy

Antes de fazer deploy em produ��o, verificar:

- [ ] Schema do banco atualizado com campos de auditoria
- [ ] Rotas de API registradas em `server/index.js`
- [ ] Componente ManualAdjustments importado em App.tsx
- [ ] Nova aba aparece no menu admin
- [ ] Bot�es de refresh aparecem em ambos headers
- [ ] Valida��es de justificativa funcionando
- [ ] Logs sendo registrados no servidor
- [ ] Indicadores visuais de "Ajuste Manual" aparecendo
- [ ] Build passa sem erros
- [ ] Testes manuais executados

---

## 12. Conclus�o

As novas funcionalidades de **Refresh Global** e **Ajustes Manuais** adicionam:

 **Controle Administrativo Total**
- Admin pode corrigir qualquer batida com justificativa

 **Auditoria Completa**
- Todas as altera��es rastreadas (quem, quando, por qu�)

 **Diferencia��o Visual Clara**
- F�cil identificar batidas org�nicas vs editadas

 **Dados Sempre Atualizados**
- Bot�o de refresh em todas as telas

 **UX Profissional**
- Valida��es, feedbacks, loading states, cores contextuais

 **Seguran�a**
- Apenas admins podem fazer ajustes
- Justificativa obrigat�ria em todas as opera��es
- Logs detalhados no servidor

---