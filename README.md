# Korean Ascension

Sistema de formulário de qualificação de leads com painel administrativo.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)

## Estrutura

- `/formulario` — página pública do formulário de qualificação de leads
- `/admin` — área protegida do painel administrativo
  - `/admin/dashboard` — página principal do admin
  - `/admin/respostas` — listagem de respostas do formulário
- `/api` — rotas de API (backend)

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).
