-- ══════════════════════════════════════════════════
-- FoundIT — Core Recovery Workflow Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════

-- 1. matches — persists AI match results with real scores
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  lost_item_id uuid references items(id) on delete cascade,
  found_item_id uuid references items(id) on delete cascade,
  owner_id uuid not null,
  finder_id uuid not null,
  university_id uuid,
  overall_score numeric(5,2) default 0,
  text_score numeric(5,2) default 0,
  image_score numeric(5,2),
  category_match boolean default false,
  location_score numeric(5,2) default 0,
  date_score numeric(5,2) default 0,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'expired')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. recovery_tracking — the central recovery entity
create table if not exists recovery_tracking (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  lost_item_id uuid references items(id),
  found_item_id uuid references items(id),
  owner_id uuid not null,
  finder_id uuid not null,
  status text default 'MATCH_FOUND',
  verification_status text default 'PENDING',
  qr_generated_at timestamptz,
  qr_scanned_at timestamptz,
  handover_confirmed_at timestamptz,
  recovered_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. tracking_events — immutable audit trail
create table if not exists tracking_events (
  id uuid primary key default gen_random_uuid(),
  recovery_id uuid references recovery_tracking(id) on delete cascade,
  event_type text not null,
  actor_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- 4. handover_tokens — cryptographically secure QR tokens
create table if not exists handover_tokens (
  id uuid primary key default gen_random_uuid(),
  recovery_id uuid references recovery_tracking(id) on delete cascade,
  token_hash text unique not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid,
  created_at timestamptz default now()
);

-- ── Indexes for performance ──────────────────────────

create index if not exists idx_matches_owner_id on matches(owner_id);
create index if not exists idx_matches_finder_id on matches(finder_id);
create index if not exists idx_matches_lost_item_id on matches(lost_item_id);
create index if not exists idx_matches_found_item_id on matches(found_item_id);
create index if not exists idx_matches_status on matches(status);
create index if not exists idx_matches_university_id on matches(university_id);

create index if not exists idx_recovery_owner_id on recovery_tracking(owner_id);
create index if not exists idx_recovery_finder_id on recovery_tracking(finder_id);
create index if not exists idx_recovery_match_id on recovery_tracking(match_id);
create index if not exists idx_recovery_status on recovery_tracking(status);

create index if not exists idx_tracking_events_recovery_id on tracking_events(recovery_id);
create index if not exists idx_tracking_events_type on tracking_events(event_type);

create index if not exists idx_handover_tokens_recovery_id on handover_tokens(recovery_id);
create index if not exists idx_handover_tokens_hash on handover_tokens(token_hash);

-- ── RLS Policies ─────────────────────────────────────

alter table matches enable row level security;
alter table recovery_tracking enable row level security;
alter table tracking_events enable row level security;
alter table handover_tokens enable row level security;

-- Allow service role to bypass RLS (service key used on backend)
-- Users can only see their own data

-- matches policies
drop policy if exists "matches_select_own" on matches;
create policy "matches_select_own" on matches
  for select using (auth.uid() = owner_id or auth.uid() = finder_id);

drop policy if exists "matches_insert_service" on matches;
create policy "matches_insert_service" on matches
  for insert with check (true);

drop policy if exists "matches_update_service" on matches;
create policy "matches_update_service" on matches
  for update using (true);

-- recovery_tracking policies
drop policy if exists "recovery_select_own" on recovery_tracking;
create policy "recovery_select_own" on recovery_tracking
  for select using (auth.uid() = owner_id or auth.uid() = finder_id);

drop policy if exists "recovery_insert_service" on recovery_tracking;
create policy "recovery_insert_service" on recovery_tracking
  for insert with check (true);

drop policy if exists "recovery_update_service" on recovery_tracking;
create policy "recovery_update_service" on recovery_tracking
  for update using (true);

-- tracking_events policies
drop policy if exists "events_select_own" on tracking_events;
create policy "events_select_own" on tracking_events
  for select using (
    exists (
      select 1 from recovery_tracking rt
      where rt.id = tracking_events.recovery_id
        and (rt.owner_id = auth.uid() or rt.finder_id = auth.uid())
    )
  );

drop policy if exists "events_insert_service" on tracking_events;
create policy "events_insert_service" on tracking_events
  for insert with check (true);

-- handover_tokens policies  
drop policy if exists "tokens_select_own" on handover_tokens;
create policy "tokens_select_own" on handover_tokens
  for select using (
    exists (
      select 1 from recovery_tracking rt
      where rt.id = handover_tokens.recovery_id
        and (rt.owner_id = auth.uid() or rt.finder_id = auth.uid())
    )
  );

drop policy if exists "tokens_manage_service" on handover_tokens;
create policy "tokens_manage_service" on handover_tokens
  for all with check (true);
