# ACAIABA

> **O estilo que marca presença.**

Plataforma de e-commerce full-stack construída com **Next.js (App Router)**, **TypeScript**, **Prisma**, **PostgreSQL** e **Tailwind CSS**. Projeto técnico de portfólio com foco em arquitetura de domínio, integridade transacional e segurança.

---

## Sobre o projeto

ACAIABA é uma loja completa — vitrine, carrinho, checkout, pedidos e painel administrativo — desenvolvida para exercitar decisões reais de engenharia: checkout idempotente, controle transacional de estoque, abstração de gateway de pagamento, autorização por papel (RBAC) resolvida no servidor e uma camada de domínio isolada da camada de transporte.

A identidade visual é premium e monocromática (preto, branco e cinzas), com tipografia forte e suporte a tema claro/escuro.

> **Nota sobre pagamentos:** o gateway incluído é uma **simulação** de PIX. Ele exercita o fluxo completo (cobrança → webhook → transição de estado do pedido), mas **não processa dinheiro**. Integrar um provedor real significa implementar a interface `PaymentGateway` em `src/lib/payments/gateway.ts`.

---

## Funcionalidades

### Vitrine
- Catálogo com **busca**, filtro por **categoria** (incluindo subcategorias), filtro por **marca**, **ordenação** e **paginação**
- Página de produto com **variantes** (tamanho/cor), galeria de imagens e **estoque por variante**
- **Carrinho persistente** com precificação calculada no servidor
- **Favoritos persistentes** por cliente
- **Cupons de desconto** com regras de uso (valor mínimo, limite global e por cliente, janela de validade)
- **Tema claro/escuro** sem flash de cor na primeira pintura

### Checkout e pedidos
- **Checkout idempotente** — a mesma `idempotencyKey` nunca cria pedido duplicado
- **Camada de pagamento abstraída** (`PaymentGateway`), com implementação PIX simulada
- **Webhook de pagamento** com verificação de assinatura e conferência de valor no servidor
- **Máquina de estados de pedido** (`PENDING → AWAITING_PAYMENT → PAID → PROCESSING → SHIPPED → DELIVERED`, mais `CANCELLED`/`REFUNDED`)
- **Controle transacional de estoque** — decremento atômico em transação PostgreSQL, sem *overselling*
- **Área do cliente** com histórico de pedidos, pagamento, cancelamento e reembolso

### Autenticação e autorização
- Cadastro e login com senha em **bcrypt**
- Sessão em **cookie HttpOnly** assinada com JWT
- **RBAC** com os papéis `CUSTOMER`, `ADMIN`, `SUPER_ADMIN`, `MANAGER`, `STOCK_MANAGER`, `SUPPORT`
- Papel e status lidos **do banco a cada requisição** — um usuário rebaixado ou suspenso perde o acesso imediatamente

### Administração
- Dashboard com métricas do período
- CRUD de produtos e variantes
- Ajuste manual de estoque com trilha de auditoria (`InventoryMovement`)
- Gestão de pedidos (status, reembolso), cupons e log de auditoria

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router, React Server Components) |
| Linguagem | TypeScript 5 |
| ORM | Prisma 7 com Driver Adapters |
| Banco de dados | PostgreSQL |
| Driver | `pg` + `@prisma/adapter-pg` |
| Estilo | Tailwind CSS 3 |
| Validação | Zod 4 |
| Autenticação | `jsonwebtoken` + `bcryptjs` |
| Testes | Vitest |
| Ícones | Lucide React |

---

## Arquitetura

O projeto segue separação de responsabilidades, aproveitando React Server Components no App Router.

```text
prisma/
  schema.prisma           # 21 models, 9 enums
  migrations/             # 3 migrations versionadas (aditivas)
  seed.ts                 # Carga inicial: categorias, marcas, produtos, admin

src/
  app/                    # Rotas (App Router)
    api/                  # 23 endpoints HTTP
      admin/              #   produtos, pedidos, cupons, estoque
      auth/               #   login, logout, me, register
      cart/ favorites/    #   carrinho e favoritos
      orders/             #   pedidos, pagamento, cancelamento
      payments/webhook/   #   retorno do gateway
      health/             #   health check
    admin/                # 10 páginas do painel administrativo
    loja/ produto/        # catálogo e detalhe de produto
    carrinho/ checkout/   # fluxo de compra
    conta/ pedidos/ favoritos/ cadastro/ login/ contato/
    sitemap.ts robots.ts  # SEO

  components/             # 15 componentes (admin, layout, orders, product, ui)
  context/                # AuthContext, CartContext, FavoritesContext, ThemeContext

  lib/
    auth/                 # regras puras de autorização (RBAC, status de conta)
    commerce/             # domínio: preço, cupom, idempotência, métricas
    config/               # cliente Prisma, erros, logging com sanitização
    inventory/ orders/ payments/

  schemas/                # validação Zod de produto e variante

  server/
    auth/                 # sessão, JWT, guards de página e de API
    commerce/             # checkout, carrinho, favoritos, cupons, pedidos, produtos
    payments/             # fábrica de gateways + PIX simulado

tests/unit/               # 11 suítes de testes unitários (Vitest)
```

**Princípio:** as regras de negócio ficam em `src/lib` e `src/server` como funções puras ou serviços, sem depender de HTTP. As rotas em `src/app/api` são finas — autenticam, validam e delegam.

---

## Como executar

### Pré-requisitos
- **Node.js** 20 ou superior
- **PostgreSQL** 16 ou 17 (local ou [Neon](https://neon.tech))

### 1. Clone o repositório

```bash
git clone https://github.com/joaoakaiaba/ACAIABA.git
cd ACAIABA
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Preencha ao menos `DATABASE_URL` e `JWT_SECRET` (veja a tabela abaixo).

### 4. Gere o Prisma Client

```bash
npx prisma generate
```

### 5. Aplique as migrations

```bash
npx prisma migrate deploy
```

As migrations estão versionadas em `prisma/migrations/` e são **aditivas** — `migrate deploy` as aplica de forma idempotente e não destrutiva.

### 6. Popule o banco (opcional)

```bash
# exige ADMIN_EMAIL e ADMIN_PASSWORD no .env
npx prisma db seed
```

O seed cria categorias, marcas, produtos e o usuário administrador. É idempotente.

### 7. Inicie o projeto

```bash
npm run dev
```

Acesse **http://localhost:3000**.

---

## Variáveis de ambiente

Todas estão documentadas em [`.env.example`](.env.example). Resumo:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | **Sim** | Connection string do PostgreSQL |
| `JWT_SECRET` | **Sim** | Assina o cookie de sessão — `openssl rand -base64 48` |
| `NEXT_PUBLIC_APP_URL` | Recomendada | Origem pública (`http://localhost:3000` em dev) |
| `ADMIN_EMAIL` | Para o seed | E-mail do administrador inicial |
| `ADMIN_PASSWORD` | Para o seed | Senha do administrador — `openssl rand -base64 24` |
| `PAYMENT_WEBHOOK_SECRET` | Em produção | Valida a assinatura dos webhooks |
| `PAYMENT_PROVIDER` | Não | `simulated` (padrão) |
| `PAYMENT_PROVIDER_MODE` | Não | `SANDBOX` (padrão) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Não | Número público do botão de contato |

Nenhum valor real é versionado. `.env` e qualquer `.env.*` estão no `.gitignore`.

---

## Scripts

```bash
npm run dev         # ambiente de desenvolvimento
npm run build       # build de produção
npm start           # serve o build de produção
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Vitest (suíte unitária)
```

---

## Segurança

Medidas realmente implementadas no código:

- **Nenhum segredo com valor padrão.** `JWT_SECRET` é obrigatório em qualquer ambiente — a aplicação não inicia sem ele. O seed exige `ADMIN_EMAIL` e `ADMIN_PASSWORD` e não cria administrador com credencial padrão.
- **Sessão em cookie HttpOnly** com `SameSite=Strict` e `Secure` em produção, assinada com JWT.
- **Senhas com bcrypt.**
- **Autorização no servidor.** O papel vem do banco a cada requisição, não do token — rebaixar ou suspender um usuário corta o acesso imediatamente.
- **Webhook de pagamento verificado.** Em produção o gateway rejeita todo evento sem `PAYMENT_WEBHOOK_SECRET`, e a comparação de assinatura é feita em tempo constante (`crypto.timingSafeEqual`).
- **Valores financeiros validados no servidor.** `processCheckout` é uma Server Action, então o cliente pode invocá-la com argumentos arbitrários: preços são sempre relidos do banco e `shippingCost`/`quantity` são validados (finitos, não negativos, inteiros) — um `shippingCost` negativo não consegue mais zerar o total do pedido.
- **Consultas parametrizadas** via Prisma (sem concatenação de SQL).
- **Logs sanitizados** — campos como `password`, `token`, `secret`, `cvv` e dados de cartão são redigidos.
- **Cabeçalhos de segurança** configurados em `next.config.mjs`: Content-Security-Policy, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`.
- **Idempotência** no checkout e no webhook, evitando pedidos e pagamentos duplicados.

---

## Status do projeto

Projeto de portfólio **funcional e em evolução**. O que está sólido: catálogo, carrinho, favoritos, checkout idempotente, pedidos, RBAC e painel administrativo, com 13 suítes e 104 testes unitários cobrindo as regras de domínio e as validações de segurança.

Limitações conhecidas e honestas:

- **Pagamento é simulado.** Não há integração com provedor real.
- **A captura de newsletter na home não tem backend** — não existe modelo de assinante no schema. O campo de opt-in do cadastro funciona (grava `Customer.newsletter`), mas o formulário da home ainda não persiste nada.
- **Rate limiting não está implementado** nas rotas de autenticação. O projeto roda em ambiente serverless (Vercel), onde um limitador em memória seria por instância e não daria proteção real entre instâncias; implementar isso corretamente exige um store compartilhado (Upstash/Redis), que ainda não faz parte da stack. Até lá, a ausência está documentada em vez de simulada.
- **Imagens usam `<img>`** em vez de `next/image`. As URLs de produto vêm do banco (host arbitrário) e o CSP só libera `images.unsplash.com`, então a migração exige decidir a política de hosts antes.
- O `buildCommand` em `vercel.json` roda `prisma migrate deploy` em todo build — para produção é preferível tratar migrations como passo de release explícito.

---

## Banco de dados

```bash
# backup
pg_dump -U <user> -h <host> -d <database> -F c -b -v -f acaiaba_backup.dump

# restore
pg_restore -U <user> -h <host> -d <database> -v acaiaba_backup.dump
```

---

## Licença

Sem licença definida. O código está público para consulta como projeto de
portfólio; na ausência de uma licença, todos os direitos permanecem reservados
ao autor.
