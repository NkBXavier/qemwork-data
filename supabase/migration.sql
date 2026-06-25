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
  priorities jsonb not null, -- ordre des 5 priorités
  additional_notes text,

  -- Méta
  user_agent text,
  submitted_at timestamptz default now()
);

-- RLS : autoriser l'insertion publique uniquement
alter table qemwork_responses enable row level security;

-- L'insertion se fait via la service-role key côté serveur (Server Action),
-- mais on garde aussi cette policy au cas où l'on souhaiterait insérer depuis
-- le client à l'avenir.
create policy "Allow public insert" on qemwork_responses
  for insert with check (true);
