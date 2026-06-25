# Qemwork – Questionnaire de qualification

Formulaire web multi-étapes envoyé par **Found ID** à Qemwork pour cadrer la
mission backend avant proposition commerciale. Les réponses sont stockées dans
Supabase.

## Stack

- Next.js 16 (App Router, TypeScript)
- React 19
- Tailwind CSS v4 + shadcn/ui
- react-hook-form + zod 4
- Supabase JS (insertion via Server Action)
- Sonner (toasts), framer-motion, @dnd-kit (ranking)

## Démarrage rapide

```bash
git clone <repo-url>
cd qemwork
npm install
cp .env.local.example .env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

L'application est accessible sur `http://localhost:3000`.

## Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécuter le contenu de
   [`supabase/migration.sql`](./supabase/migration.sql). Cela crée la table
   `qemwork_responses` ainsi que la politique RLS d'insertion publique.
3. Dans **Project Settings → API**, copier :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`
4. Coller ces valeurs dans `.env.local`.

> La clé `service_role` ne doit **jamais** être exposée côté client. Elle est
> utilisée uniquement dans le Server Action `app/actions/submit-response.ts`.

## Consultation des réponses

Pas de back-office dédié : ouvrir Supabase Studio → table `qemwork_responses`.
Tri par `submitted_at desc`.

## Structure

```
app/
  page.tsx                       # Landing (/)
  questionnaire/
    page.tsx                     # Coquille serveur
    questionnaire-form.tsx       # Formulaire client multi-étapes
    priorities-sortable.tsx      # Widget de ranking drag & drop
  merci/page.tsx                 # Confirmation (/merci)
  actions/submit-response.ts     # Server Action (validation + insert)
lib/
  schema.ts                      # Schémas zod partagés (client + serveur)
  supabase/server.ts             # Client Supabase service-role
components/ui/                   # shadcn/ui primitives
supabase/migration.sql           # Migration SQL
```

## Validation & sauvegarde

- Validation zod côté **client** (par étape) ET côté **serveur** (schéma
  complet dans le Server Action).
- Les réponses sont sauvegardées automatiquement dans `localStorage` à chaque
  modification, sous la clé `qemwork-qualification-v1`. Effacées après envoi.
- Rate limit en mémoire côté serveur : 5 soumissions max / IP / heure.

## Déploiement Vercel

1. Importer le repo dans Vercel.
2. Ajouter les variables d'environnement dans **Project Settings →
   Environment Variables** :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Déployer. Aucune autre configuration n'est requise (pas d'edge runtime
   spécifique, pas de webhook).

> Le rate limit étant en mémoire, il est reset à chaque cold start. Suffisant
> pour cette V1 ; à remplacer par Upstash ou Supabase si trafic.

## Commandes utiles

```bash
npm run dev      # Serveur de dev
npm run build    # Build de production
npm run start    # Lancer le build
npm run lint     # ESLint
```
