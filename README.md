# ACAIABA — O estilo que marca presença.

ACAIABA é uma aplicação de e-commerce comercial de alto padrão projetada com foco absoluto em segurança, integridade financeira, escalabilidade transacional e uma experiência visual contemporânea premium.

A plataforma atende aos segmentos de **Calçados, Fitness e Academia, Moda, Casa e Enxoval, e Beleza e Cuidados**.

---

## 1. Arquitetura do Sistema

O projeto segue os princípios de separação de responsabilidades (Clean Architecture) aproveitando todo o potencial do **Next.js App Router (React Server Components)**.

```text
src/
  app/                # Rotas da aplicação (Roteamento baseado em arquivos)
    (store)/          # Área da vitrine da loja
    admin/            # Painel administrativo com controle RBAC
    api/              # Endpoints HTTP da API (incluindo Health Check)
  components/         # Componentes visuais reutilizáveis
    layout/           # Estruturas globais (Header, Footer, Sidebar)
    ui/               # Elementos atômicos da interface (ProductCard, etc.)
    product/          # Visões de produto interativas
  context/            # Contextos de estado do cliente (Carrinho e Favoritos)
  lib/
    config/           # Configurações de banco (Prisma, pg), Logs, Erros
  schemas/            # Schemas de validação de dados (Zod)
  server/
    auth/             # Utilitários de sessão segura e hashing (JWT, bcryptjs)
    commerce/         # Ações comerciais transacionais (Checkout, etc.)
  types/              # Tipagens globais do TypeScript
tests/
  unit/               # Suíte de testes unitários automatizados (Vitest)
```

---

## 2. Stack de Tecnologia & Versões Reais

* **Framework:** Next.js `14.2.5` (App Router)
* **Linguagem:** TypeScript `5.x`
* **Estilização:** Tailwind CSS `3.4`
* **Banco de Dados:** PostgreSQL `17` (nativo)
* **ORM:** Prisma `7.9.1` (com Driver Adapters para concorrência)
* **Driver do Banco:** `pg` + `@prisma/adapter-pg`
* **Validação:** Zod `4.4`
* **Criptografia:** bcryptjs `3.0`, jsonwebtoken `9.0`
* **Ícones:** Lucide React `1.33`
* **Suíte de Testes:** Vitest `4.1`

---

## 3. Configuração Local & Setup

### Pré-requisitos
* Node.js `20.x` ou superior
* PostgreSQL `16.x` ou `17.x` ativo

### Passos para Instalação

1. **Clonar e acessar o repositório:**
   ```bash
   git clone <repo-url> acaiaba
   cd acaiaba
   ```

2. **Instalar dependências:**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente:**
   Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
   Edite o `.env` para apontar para a sua instância local do PostgreSQL.

4. **Executar Migrations no banco:**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Gerar o Prisma Client:**
   ```bash
   npx prisma generate
   ```

6. **Popular o banco de dados (Seed):**
   ```bash
   npx prisma db seed
   ```

7. **Executar em modo de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000` no seu navegador para ver a loja ativa!

---

## 4. Rodando os Testes Automatizados

A ACAIABA possui uma cobertura de testes unitários que valida fluxos de negócio críticos (preços, cálculos de cupom, esquemas de validação de dados e segurança de hashes de senha).

Para executar os testes:
```bash
npm run test
```

---

## 5. Validação de Produção & Quality Gates

Para garantir que a aplicação está pronta para ser publicada em produção com zero erros, execute o ciclo de validação completo:

```bash
# Verificar tipos do TypeScript
npm run typecheck

# Verificar regras de linting (ESLint)
npm run lint

# Executar suíte de testes
npm run test

# Compilar build de produção otimizado
npm run build
```

---

## 6. Procedimento de Backup do Banco de Dados

### Criar um Backup do PostgreSQL (dump):
```bash
pg_dump -U acaiaba_user -h localhost -d acaiaba_db -F c -b -v -f acaiaba_db_backup.dump
```

### Restaurar o Banco a partir de um Backup:
```bash
pg_restore -U acaiaba_user -h localhost -d acaiaba_db -v acaiaba_db_backup.dump
```

---

## 7. Segurança Hardening Aplicada

1. **Sessões HTTP-Only:** Tokens de sessão JWT assinados são salvos em cookies configurados com `HttpOnly`, `SameSite: "strict"` e `Secure` (em produção), prevenindo roubo de sessões via scripts maliciosos.
2. **Criptografia Forte:** Hashes de senhas de usuários utilizam salt rounds seguros via `bcryptjs`.
3. **Cabeçalhos de Segurança HTTP:** Configurados de forma rígida em `next.config.mjs` incluindo Content-Security-Policy (CSP), X-Frame-Options (DENY), X-Content-Type-Options (nosniff) e HSTS de 1 ano.
4. **Proteção contra SQL Injection:** Consultas parametrizadas nativas do Prisma ORM em toda a base de dados.
5. **Prevenção de Race Conditions:** Operações de decremento de estoque e vendas utilizam PostgreSQL `$transaction` atômico para evitar que o estoque fique negativo ou que ocorra overselling.
