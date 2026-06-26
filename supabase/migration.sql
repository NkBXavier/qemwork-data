-- Table des réponses au questionnaire Qemwork
create table if not exists qemwork_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- Identification
  contact_name text not null,
  contact_role text not null,
  contact_email text not null,
  contact_phone text,

  -- Activité
  active_users text not null,
  growth_goals text not null,

  -- Architecture
  backend_setup text not null,
  current_issues text not null,
  has_documentation text not null,
  documentation_link text,
  documentation_file_path text,
  documentation_file_name text,

  -- Données & sécurité
  data_types text[] not null,
  data_types_other text,
  had_incidents text not null,
  incidents_details text,

  -- Direction
  migration_intent text not null,
  technical_needs text[] not null,

  -- Engagement
  engagement_type text[] not null,
  additional_notes text,

  -- Phase 1 — retour client sur rapport d'analyse
  report_feedback text,

  -- Phase 3 — retour client sur récapitulatif
  recap_feedback text,

  -- Méta
  user_agent text,
  submitted_at timestamptz default now()
);

-- Pour bases existantes
alter table qemwork_responses
  add column if not exists report_feedback text,
  add column if not exists recap_feedback text,
  add column if not exists documentation_file_path text,
  add column if not exists documentation_file_name text;

alter table qemwork_responses
  drop column if exists priorities;

-- Bucket de stockage pour la documentation technique uploadée
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'qemwork-docs',
  'qemwork-docs',
  false,
  10485760, -- 10 Mo
  array[
    'application/pdf',
    'application/zip',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/markdown'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Pas de policy publique : uploads via service-role key côté serveur,
-- lecture via dashboard ou signed URLs générées par l'équipe Found ID.

-- RLS : autoriser l'insertion publique uniquement
alter table qemwork_responses enable row level security;

-- L'insertion se fait via la service-role key côté serveur (Server Action),
-- mais on garde aussi cette policy au cas où l'on souhaiterait insérer depuis
-- le client à l'avenir.
drop policy if exists "Allow public insert" on qemwork_responses;
create policy "Allow public insert" on qemwork_responses
  for insert with check (true);
