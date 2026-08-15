# Plutos

Application Next.js configurée pour utiliser PostgreSQL localement et Supabase
PostgreSQL en production avec le même schéma Drizzle.

## Base de données

### Développement local

1. Créez la base PostgreSQL :

```sql
CREATE DATABASE plutos_dev;
```

2. Copiez le modèle de configuration :

```bash
cp .env.example .env.local
```

3. Adaptez `DATABASE_URL` dans `.env.local`, puis appliquez le schéma :

```bash
npm run db:push
```

### Production avec Supabase

Dans **Supabase > Project Settings > Database > Connection string**, copiez
l'URL du **Transaction pooler**. Définissez-la comme secret `DATABASE_URL` sur
la plateforme d'hébergement, avec `sslmode=require`. Ne placez jamais cette URL
dans un fichier commité.

Avant une mise en production, générez puis commitez les migrations :

```bash
npm run db:generate
```

Appliquez-les à Supabase depuis un environnement sécurisé qui possède la
variable de production :

```bash
npm run db:migrate
```

Les tables de l'application doivent être déclarées dans
`lib/db/schema.ts`. L'endpoint `GET /api/health/database` permet de vérifier la
connexion sans exposer les identifiants.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
