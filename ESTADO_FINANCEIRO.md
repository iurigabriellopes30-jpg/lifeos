# ESTADO DE CONVERSAÇÃO FINANCEIRA

## PROBLEMA RESOLVIDO
❌ **ANTES:** Loop infinito com perguntas repetidas  
✅ **AGORA:** Estado persistente com memória de perguntas feitas

---

## ARQUITETURA DO ESTADO

### 1. FinancialConversationState (Novo)
Arquivo: `financial_conversation_state.json`

```json
{
  "isActive": false,
  "collectedData": {
    "debts": [],
    "totalDivida": null,
    "urgencia": null,
    "prazo": null
  },
  "questionsAsked": [],
  "dataComplete": false,
  "readyToExecute": false,
  "executed": false
}
```

### 2. Campos e Função

| Campo | Tipo | Função |
|-------|------|--------|
| `isActive` | boolean | Indica se conversação financeira está ativa |
| `collectedData` | object | Dados coletados durante conversa |
| `questionsAsked` | array | Perguntas já feitas (evita repetir) |
| `dataComplete` | boolean | Todos dados necessários coletados |
| `readyToExecute` | boolean | Pronto para atualizar financeiro |
| `executed` | boolean | Ação executada, encerrar fluxo |

---

## FLUXO CORRIGIDO

### Fase 1: Coleta Inteligente
```
Usuário: "tenho uma dívida"
IA: "Qual é o valor total da dívida?"
[questionsAsked: ["totalDivida"]]

Usuário: "500 reais"
[collectedData.totalDivida = 500]
IA: "Essa dívida está atrasada ou vence em breve?"
[questionsAsked: ["totalDivida", "urgencia"]]

Usuário: "está atrasada"
[collectedData.urgencia = "atrasada"]
IA: "Em quanto tempo você quer quitar? (ex: 6 meses)"
[questionsAsked: ["totalDivida", "urgencia", "prazo"]]

Usuário: "3 meses"
[collectedData.prazo = 3, dataComplete = true]
```

### Fase 2: Cálculo Automático
```
[readyToExecute = true]
IA calcula:
- ritmoMensal = 500 / 3 = 166.67
- ritmoDiario = 166.67 / 30 = 5.56

IA: "Pronto! Dados completos:
- Dívida: R$ 500.00
- Prazo: 3 meses
- Ritmo mensal: R$ 166.67
- Ritmo diário: R$ 5.56

Vou atualizar seu Financeiro."
```

### Fase 3: Execução e Encerramento
```
[executed = true]
IA atualiza FinanceiroState:
- faseAtual = 4
- totalDivida = 500
- prazoAlvoMeses = 3
- ritmoMensal = 166.67
- ritmoDiario = 5.56
- focoAtual = "Executar e repetir"

IA: "Financeiro atualizado! Meta definida. Deseja analisar outra área?"

[Estado resetado para nova conversa]
```

---

## LÓGICA ANTI-LOOP

### ✅ Perguntas NÃO Repetem
```python
if not has_debt and "totalDivida" not in conv_state.questionsAsked:
    response = "Qual é o valor total da dívida?"
    conv_state.questionsAsked.append("totalDivida")
```

Se `"totalDivida"` já está em `questionsAsked`, essa pergunta é pulada.

### ✅ Dados Já Coletados Não São Perdidos
```python
conv_state.collectedData["totalDivida"] = 500
```

Persiste em arquivo JSON, não some entre mensagens.

### ✅ Execução Acontece Apenas 1 Vez
```python
if conv_state.readyToExecute and not conv_state.executed:
    # Executa atualização
    conv_state.executed = True
```

Após executar, flag `executed = True` impede repetição.

### ✅ Reset Após Conclusão
```python
if conv_state.executed:
    reset_conversation_state()
```

Limpa estado para nova conversa sem carregar histórico antigo.

---

## LEITURA DO FINANCEIRO

### Comando: "o que tem no meu financeiro?"
```python
is_read_request = any(word in user_lower for word in [
    "como está", "o que tem", "mostre", "status", "meu financeiro"
])
```

**Resposta:**
```
"Seu financeiro: Fase: 4 | Dívida: R$ 500.00 | Prazo: 3 meses | 
Ritmo mensal: R$ 166.67 | Foco: Executar e repetir"
```

❌ **NÃO** inicia coleta novamente  
✅ **APENAS** lê e exibe dados existentes

---

## GARANTIAS

### ❌ Proibições Absolutas Implementadas

1. ❌ **Não repetir perguntas** → `questionsAsked` verifica antes
2. ❌ **Não reiniciar coleta** → Estado persiste em JSON
3. ❌ **Não responder texto genérico** → Orquestração estruturada
4. ❌ **Não assumir "não decidiu"** → `collectedData` é fonte de verdade
5. ❌ **Não criar loop** → `executed` encerra fluxo

### ✅ Garantias Implementadas

1. ✅ **Pergunta apenas o necessário** → Verifica dados faltantes
2. ✅ **Extrai valores automaticamente** → Regex em mensagens
3. ✅ **Calcula automaticamente** → Quando dados completos
4. ✅ **Executa automaticamente** → Quando pronto
5. ✅ **Encerra após execução** → Reset do estado
6. ✅ **Permite leitura sem reiniciar** → Detecção de read_request

---

## ARQUIVOS MODIFICADOS

### lifeos-backend/main.py
- **Linha 88-91:** Criado modelo `FinancialConversationState`
- **Linha 31:** Adicionado arquivo `FINANCE_CONV_FILE`
- **Linha 143-165:** Funções `load_conversation_state()`, `save_conversation_state()`, `reset_conversation_state()`
- **Linha 227-351:** Reescrito `orchestrate_financeiro()` com estado persistente

---

## COMO TESTAR

### 1. Testar Coleta Linear
```
Usuário: "tenho uma dívida"
IA: "Qual é o valor total da dívida?"

Usuário: "800 reais"
IA: "Essa dívida está atrasada ou vence em breve?"

Usuário: "vence em 10 dias"
IA: "Em quanto tempo você quer quitar?"

Usuário: "6 meses"
IA: "Pronto! Dados completos... Vou atualizar seu Financeiro."
```

### 2. Testar Anti-Loop
```
Usuário: "tenho uma dívida de 500"
IA: "Essa dívida está atrasada ou vence em breve?"

Usuário: "atrasada"
IA: "Em quanto tempo você quer quitar?"

Usuário: "3 meses"
IA: "Pronto! Dados completos..."

Usuário: "3 meses"
[NÃO pergunta novamente, já tem prazo]
```

### 3. Testar Leitura
```
Usuário: "o que tem no meu financeiro?"
IA: "Seu financeiro: Fase: 4 | Dívida: R$ 500.00..."
[Lê e exibe, NÃO inicia coleta]
```

### 4. Testar Execução Única
```
[Após dados completos]
IA: "Financeiro atualizado! Meta definida."
[executed = true, fluxo encerrado]

Usuário: "atualiza de novo"
[NÃO repete, estado foi resetado]
```

---

## PRÓXIMOS PASSOS

Após validar funcionamento:
1. Aplicar mesma lógica para Tasks, Rotina, Calendario
2. Criar estados de conversação para cada área
3. Unificar em orquestrador central
4. Adicionar histórico de decisões executadas

---

## STATUS
✅ **IMPLEMENTADO E TESTÁVEL**
- Backend rodando em http://0.0.0.0:8000
- Frontend rodando em http://localhost:5173
- Estado de conversação criado
- Lógica anti-loop implementada
- Pronto para testes no chat
