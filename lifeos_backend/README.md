# LifeOS Backend

Backend mínimo para gerenciar chamadas de IA via OpenRouter.

## Configuração

### 1. Criar ambiente virtual

```bash
python -m venv venv
```

### 2. Ativar ambiente virtual

Windows:
```bash
venv\Scripts\activate
```

Linux/Mac:
```bash
source venv/bin/activate
```

### 3. Instalar dependências

```bash
pip install -r requirements.txt
```

### 4. Configurar variáveis de ambiente

Crie um arquivo `.env` na pasta `lifeos-backend/` (este arquivo está em `.gitignore` e NÃO será versionado):

```
OPENROUTER_API_KEY=sk-or-v1-...
```

## Execução

```bash
uvicorn main:app --reload --port 8000
```

O servidor estará disponível em `http://localhost:8000`

## Endpoints

### GET /health
Verifica status do servidor.

**Resposta:**
```json
{
  "status": "ok"
}
```

### POST /chat
Envia mensagem para a IA.

**Request:**
```json
{
  "message": "Olá, como você está?"
}
```

**Response:**
```json
{
  "reply": "Resposta da IA aqui"
}
```

## Documentação Interativa

Acesse `http://localhost:8000/docs` para ver a documentação automática do Swagger.
