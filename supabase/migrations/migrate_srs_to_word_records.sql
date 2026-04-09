-- Migration: move per-user SRS state from words → word_records
-- Date: 2026-04-09
-- Run this ONCE in Supabase SQL Editor

-- Step 1: add SRS columns to word_records
alter table word_records
  add column if not exists stability   float  not null default 1,
  add column if not exists difficulty  float  not null default 1.5,
  add column if not exists last_review bigint not null default 0,
  add column if not exists next_review bigint not null default 0;

-- Step 2: copy existing SRS data from words into every matching word_records row
update word_records wr
set
  stability   = w.stability,
  difficulty  = w.difficulty,
  last_review = w.last_review,
  next_review = w.next_review
from words w
where wr.word_id = w.id
  and w.stability  is not null
  and w.next_review > 0;

-- Step 3: index for efficient "due words" query per user
create index if not exists idx_word_records_user_next_review
  on word_records (user_id, next_review);

-- Step 4: (optional) keep words.stability etc. for now but stop writing to them
-- They will be ignored by the app after this migration.
