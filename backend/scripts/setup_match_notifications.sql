-- Apply once to the existing Supabase project before deploying matching changes.
-- Both changes are additive. Existing notifications remain in place.

alter table public.notifications
  add column if not exists type text not null default 'system';

alter table public.notifications
  add column if not exists meta_data jsonb not null default '{}'::jsonb;

-- A lost/found pair should only produce one match, even on concurrent app instances.
create unique index if not exists matches_unique_item_pair
  on public.matches (lost_item_id, found_item_id);

-- A recipient should only get one alert for the same pair.
create unique index if not exists notifications_unique_match_recipient
  on public.notifications (
    user_id,
    (meta_data->>'lost_item_id'),
    (meta_data->>'found_item_id')
  )
  where type = 'match'
    and meta_data ? 'lost_item_id'
    and meta_data ? 'found_item_id';
