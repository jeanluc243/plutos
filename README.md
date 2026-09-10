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

## Sauvegarder et déployer toutes les modifications

Une livraison complète contient deux opérations différentes :

- **Git** sauvegarde le code, `package-lock.json`, `lib/db/schema.ts`, les
  migrations SQL et les métadonnées du dossier `drizzle/` ;
- **PostgreSQL/Supabase** conserve les données et reçoit les migrations avec
  `npm run db:migrate`.

Les lignes présentes dans PostgreSQL ne sont jamais enregistrées par
`git commit`. Un export de la base doit être conservé séparément et ne doit pas
être ajouté au dépôt, car il peut contenir des données personnelles et des
secrets.

### Première configuration de Vercel CLI

Installez et connectez la CLI une seule fois :

```bash
npm install --global vercel
vercel login
vercel whoami
vercel link
```

`vercel link` crée le dossier local `.vercel/`, déjà ignoré par Git, et relie ce
dossier au projet Vercel. Exécutez toujours les commandes suivantes depuis la
racine du projet.

Ajoutez les variables de production sans écrire leurs valeurs dans une
commande, un commit ou le README :

```bash
vercel env add DATABASE_TARGET production
vercel env add SUPABASE_DATABASE_URL production --sensitive
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env ls
```

Dans Vercel, `SUPABASE_DATABASE_URL` doit être l'URL du **Transaction pooler**
sur le port `6543`. Le fichier local `.env.production.local`, utilisé pour les
migrations, doit garder l'URL directe ou celle du **Session pooler** sur le port
`5432`. Les deux URL doivent contenir `sslmode=require`.

Si des déploiements Preview sont utilisés, configurez-les explicitement avec
une base de démonstration hébergée et accessible depuis Vercel :

```bash
vercel env add DATABASE_TARGET preview
vercel env add DEMO_DATABASE_URL preview --sensitive
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
```

Une URL PostgreSQL en `localhost` ne fonctionne pas depuis un déploiement
Vercel.

### Commandes à exécuter à chaque nouvelle version

Cette checklist est le chemin court pour publier une nouvelle version. Elle
suppose que `vercel link` et les variables Vercel ont déjà été configurés, et
que `.env.production.local` contient la connexion Supabase de migration sur le
port `5432` avec `sslmode=require`.

#### 1. Contrôler et préparer la version

```bash
cd /Volumes/SSD-Apps/Projects/Plutos

git status --short
git diff --check

# Cette commande est sans danger s'il n'y a aucun changement de schéma.
npm run db:generate
git diff -- lib/db/schema.ts drizzle/

# Applique les migrations à la base PostgreSQL locale de développement.
npm run db:migrate

npm run lint
npx tsc --noEmit
npm run build
```

Arrêtez la publication si une commande échoue. Vérifiez également qu'aucun
fichier `.env*`, dump PostgreSQL, mot de passe ou jeton n'apparaît dans le diff.

#### 2. Enregistrer le code et les migrations

```bash
git add -A
git status --short
git diff --cached --check
git diff --cached --stat
git diff --cached
git commit -m "feat: décrire la nouvelle version"
```

Le commit doit inclure le code, `package-lock.json`, `lib/db/schema.ts`, les
fichiers SQL de `drizzle/` et les snapshots générés, mais jamais les secrets ni
les données exportées de PostgreSQL.

#### 3. Sauvegarder puis migrer Supabase

Pour une migration sensible, créez d'abord un backup depuis Supabase ou avec
`pg_dump`. Appliquez ensuite les migrations de production :

```bash
NODE_ENV=production npm run db:migrate
```

Ne continuez que si la migration réussit. Cette commande utilise
`DATABASE_TARGET=production` et `SUPABASE_DATABASE_URL` définis dans
`.env.production.local`.

#### 4. Publier et déployer

Si l'intégration Git Vercel est active, le push suffit :

```bash
git push origin main
npx vercel ls
```

Si le déploiement Git automatique n'est pas actif, poussez le code puis créez
un candidat de production sans lui attribuer immédiatement le domaine :

```bash
git push origin main
npx vercel --prod --skip-domain
npx vercel inspect URL_DU_CANDIDAT_PRODUCTION
npx vercel curl /api/health/database --deployment URL_DU_CANDIDAT_PRODUCTION
npx vercel promote URL_DU_CANDIDAT_PRODUCTION
```

N'utilisez qu'une seule de ces deux méthodes pour éviter deux déploiements de
la même version.

#### 5. Vérifier après la mise en ligne

```bash
npx vercel inspect URL_DU_DEPLOIEMENT
npx vercel curl /api/health/database --deployment URL_DU_DEPLOIEMENT
npx vercel logs URL_DU_DEPLOIEMENT
```

La route de santé doit retourner `database: "ok"`, `provider: "supabase"` et
`target: "production"`. En cas d'erreur applicative, revenez au déploiement
précédent avec `npx vercel rollback`. Ce rollback ne restaure pas le schéma de
la base de données.

### Workflow complet pour chaque livraison

#### 1. Vérifier les fichiers modifiés

```bash
git status --short
git diff
```

Vérifiez particulièrement qu'aucun fichier `.env*`, dump PostgreSQL, mot de
passe ou clé privée ne va être commité.

#### 2. Générer et tester les migrations

Si `lib/db/schema.ts` a changé :

```bash
npm run db:generate
git diff -- lib/db/schema.ts drizzle/
npm run db:migrate
```

La dernière commande applique les nouvelles migrations à PostgreSQL local avec
la configuration de `.env.local`.

#### 3. Valider l'application

```bash
npm run lint
npm run build
```

#### 4. Enregistrer toutes les modifications dans Git

```bash
git add -A
git status --short
git diff --cached
git commit -m "feat: description de la livraison"
```

`git diff --cached` est la dernière vérification avant l'enregistrement du
commit. Les nouveaux fichiers SQL et JSON du dossier `drizzle/` doivent y
apparaître lorsqu'une migration a été générée.

#### 5. Sauvegarder les données avant une migration sensible

Avant une migration qui supprime ou transforme des colonnes, faites un backup
Supabase ou un export `pg_dump`. Lorsque `SUPABASE_DATABASE_URL` est déjà
chargée dans l'environnement du terminal :

```bash
mkdir -p ../plutos-backups
pg_dump --dbname="$SUPABASE_DATABASE_URL" --format=custom --file="../plutos-backups/plutos-before-release.dump"
```

Le dossier de backup est volontairement créé en dehors du dépôt. Pour des
backups réguliers, préférez également les sauvegardes et le Point-in-Time
Recovery proposés par Supabase.

#### 6. Appliquer la migration à Supabase

Avec la connexion de migration sur le port `5432` présente dans
`.env.production.local` :

```bash
NODE_ENV=production npm run db:migrate
```

Les migrations doivent être compatibles avec la version de l'application qui
est encore en ligne. Pour un changement destructif, utilisez plusieurs
livraisons : ajouter la nouvelle structure, migrer les données, déployer le code
qui l'utilise, puis supprimer l'ancienne structure dans une livraison séparée.

#### 7. Pousser le commit

```bash
git push origin main
```

Si l'intégration Git Vercel est active, ce push déclenche déjà le déploiement de
production. Dans ce cas, il ne faut pas exécuter également `vercel --prod`, car
cela créerait un deuxième déploiement identique.

#### 8. Déployer manuellement avec Vercel CLI

Lorsque le déploiement automatique Git n'est pas utilisé :

```bash
vercel --prod
```

Pour tester une Preview connectée à la base de démonstration :

```bash
vercel
vercel ls
vercel inspect URL_DE_LA_PREVIEW
```

Cette Preview utilise les variables `preview` et ne doit pas être promue en
production. Pour tester exactement un artefact construit avec les variables de
production avant de lui attribuer le domaine principal, créez plutôt un candidat
de production sans alias :

```bash
vercel --prod --skip-domain
vercel inspect URL_DU_CANDIDAT_PRODUCTION
vercel curl /api/health/database --deployment URL_DU_CANDIDAT_PRODUCTION
vercel promote URL_DU_CANDIDAT_PRODUCTION
```

Après le déploiement, vérifiez l'application et la connexion à la base :

```bash
vercel curl /api/health/database --deployment URL_DU_DEPLOIEMENT
vercel logs URL_DU_DEPLOIEMENT
```

### Redéployer, forcer un build ou revenir en arrière

Créer un nouveau déploiement de production à partir du dossier courant :

```bash
vercel --prod
```

Recompiler sans réutiliser le cache de build :

```bash
vercel --prod --force
```

Redéployer une ancienne URL avec les mêmes sources et réglages :

```bash
vercel ls
vercel redeploy URL_DU_DEPLOIEMENT
```

Promouvoir un candidat construit avec les variables de production sans
reconstruire :

```bash
vercel promote URL_DU_CANDIDAT_PRODUCTION
```

Revenir au déploiement de production précédent :

```bash
vercel rollback
```

Un rollback Vercel remet l'ancien code en ligne, mais **n'annule pas une
migration PostgreSQL**. Les migrations doivent donc rester rétrocompatibles ou
posséder une procédure de restauration testée.

### Résumé rapide

Pour une livraison ordinaire avec une migration additive et un déploiement
manuel :

```bash
npm run db:generate
npm run db:migrate
npm run lint
npm run build
git add -A
git diff --cached
git commit -m "feat: description de la livraison"
NODE_ENV=production npm run db:migrate
git push origin main
vercel --prod
```

N'utilisez la dernière commande que si le push Git ne déclenche pas déjà Vercel.

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
