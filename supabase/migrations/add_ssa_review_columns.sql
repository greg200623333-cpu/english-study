-- Add SM-2 spaced repetition columns to words table
-- Migration: add_ssa_review_columns
-- Date: 2026-04-08

alter table words add column if not exists stability float not null default 1;
alter table words add column if not exists difficulty float not null default 1.5;
alter table words add column if not exists last_review bigint not null default 0;
alter table words add column if not exists next_review bigint not null default 0;

-- Index for efficient due-word queries
create index if not exists idx_words_next_review on words(next_review);

-- Update existing words to have initial review state (due immediately)
update words
set next_review = extract(epoch from now())::bigint * 1000
where next_review = 0;

-- Allow authenticated users to update review columns on words
drop policy if exists "认证用户可更新单词复习数据" on words;
create policy "认证用户可更新单词复习数据" on words
  for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
