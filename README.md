# Plutos

Application Next.js configurée avec deux bases strictement séparées : PostgreSQL
pour le développement et la démo, et Supabase PostgreSQL pour la production,
avec le même schéma Drizzle.

## Base de données

### Développement et démo avec PostgreSQL

1. Créez la base PostgreSQL :

```sql
CREATE DATABASE plutos_dev;
```

2. Copiez le modèle de configuration :

```bash
cp .env.example .env.local
```

3. Gardez cette configuration dans `.env.local` :

```dotenv
DATABASE_TARGET=demo
DEMO_DATABASE_URL=postgresql://macbookpro@localhost:5432/plutos_dev?sslmode=disable
```

Le paramètre `sslmode=disable` désactive SSL uniquement pour PostgreSQL local.

4. Appliquez les migrations existantes à la base locale :

```bash
npm run db:migrate
```

### Production avec Supabase

Le schéma de la base locale et celui de Supabase doivent être synchronisés par
les migrations Drizzle présentes dans le dossier `drizzle/`. La base locale ne
doit pas être copiée directement vers la production à chaque changement.

#### Connexion utilisée par l'application

Dans **Supabase > Project Settings > Database > Connection string**, copiez
l'URL du **Transaction pooler**. Cette connexion, généralement sur le port
`6543`, convient à l'application déployée et aux environnements serverless :

```dotenv
DATABASE_TARGET=production
SUPABASE_DATABASE_URL=postgresql://...pooler.supabase.com:6543/postgres?sslmode=require
```

#### Connexion utilisée pour les migrations

Pour appliquer une migration, utilisez de préférence la connexion directe
Supabase sur le port `5432`. Si votre réseau ne prend pas en charge IPv6,
utilisez le **Session pooler**, également sur le port `5432`. Le Transaction
pooler sur le port `6543` est réservé à l'exécution de l'application et n'est
pas recommandé pour les migrations.

Créez un fichier `.env.production.local` non commité :

```dotenv
DATABASE_TARGET=production
SUPABASE_DATABASE_URL=postgresql://postgres.PROJECT_REF:MOT_DE_PASSE@REGION.pooler.supabase.com:5432/postgres?sslmode=require
```

Consultez la [documentation Supabase sur les méthodes de connexion](https://supabase.com/docs/guides/database/connecting-to-postgres)
pour récupérer l'URL exacte de votre projet.

Ne placez jamais `SUPABASE_DATABASE_URL` dans un fichier commité. Une cible de
production refuse une URL qui ne pointe pas vers Supabase ou qui n'utilise pas
`sslmode=require`. Inversement, la cible de démo refuse une URL Supabase.

Les déploiements de prévisualisation compilés avec `NODE_ENV=production`
doivent définir explicitement `DATABASE_TARGET=demo`. L'absence de cible dans
un build de production provoque volontairement une erreur afin d'éviter toute
connexion accidentelle à la mauvaise base.

### Migrer un changement du local vers Supabase

1. Modifiez les tables dans `lib/db/schema.ts`.
2. Générez la migration :

```bash
npm run db:generate
```

3. Vérifiez et commitez les fichiers créés dans `drizzle/`.
4. Appliquez la migration à PostgreSQL local :

```bash
npm run db:migrate
```

5. Testez l'application localement.
6. Appliquez exactement la même migration à Supabase avec la configuration de
   production :

```bash
NODE_ENV=production npm run db:migrate
```

7. Vérifiez les migrations appliquées dans l'éditeur SQL de Supabase :

```sql
SELECT count(*) FROM drizzle.__drizzle_migrations;
```

Le nombre doit correspondre aux migrations suivies dans
`drizzle/meta/_journal.json`.

`npm run db:push` peut servir pour un prototype local jetable, mais ne doit pas
être utilisé en production : cette commande modifie directement le schéma sans
créer l'historique de migration attendu.

### Transférer des données

Les migrations synchronisent uniquement la structure des tables. Le transfert
des lignes de la base locale vers Supabase est une opération séparée, réalisée
ponctuellement avec `pg_dump` et `pg_restore`. Évitez de copier automatiquement
les données de test vers la production, en particulier les comptes, commandes
et informations sensibles.

Les tables de l'application doivent être déclarées dans `lib/db/schema.ts`.
La migration détecte les fonctions et rôles Supabase avant d'ajouter la clé
étrangère vers `auth.users` et la politique RLS ; elle reste donc applicable sur
le PostgreSQL de démo. L'endpoint `GET /api/health/database` vérifie la connexion
et retourne uniquement la cible et le fournisseur, jamais les identifiants.

Les variables `NEXT_PUBLIC_SUPABASE_URL` et
`NEXT_PUBLIC_SUPABASE_ANON_KEY` concernent l'authentification Supabase déjà
utilisée par l'application. Elles ne choisissent pas la base de données Drizzle.

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
