-- ──────────────────────────────────────────
-- FoundIT: Support Session Anchor Item
-- ──────────────────────────────────────────
-- Run this script in the Supabase SQL Editor.
-- It creates a special "Item" record with a fixed UUID. 
-- We use this item as the anchor for all item-less Support and Admin chats 
-- to satisfy the foreign key constraints in the messages table.

insert into items (id, user_id, title, description, type, category, status) 
values (
  '11111111-1111-1111-1111-111111111111', 
  (select id from profiles where role = 'super_admin' limit 1), -- Assign to first super admin
  'Support Session', 
  'This is a virtual item used to anchor support and admin chats. Do not delete.', 
  'FOUND', 
  'System', 
  'archived'
) 
on conflict (id) do nothing;
