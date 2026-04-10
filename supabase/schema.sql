-- 用户学习进度表
create table if not exists profiles (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password_hash text not null,
  nickname text,
  created_at timestamptz default now()
);

-- 为用户名创建索引
create index if not exists idx_profiles_username on profiles(username);

create table if not exists questions (
  id serial primary key,
  category text not null,
  type text not null,
  passage text,
  content text not null,
  options jsonb,
  answer text not null,
  explanation text,
  difficulty int default 2,
  created_at timestamptz default now()
);

create table if not exists quiz_records (
  id serial primary key,
  user_id uuid references profiles(id) on delete cascade,
  question_id int references questions(id),
  user_answer text,
  is_correct boolean,
  created_at timestamptz default now()
);

create table if not exists words (
  id serial primary key,
  word text not null,
  phonetic text,
  meaning text not null,
  example text,
  category text
);

create table if not exists word_records (
  id serial primary key,
  user_id uuid references profiles(id) on delete cascade,
  word_id int references words(id),
  status text default 'new',
  updated_at timestamptz default now(),
  unique(user_id, word_id)
);

create table if not exists essays (
  id serial primary key,
  user_id uuid references profiles(id) on delete cascade,
  category text,
  title text,
  content text not null,
  score int,
  feedback text,
  created_at timestamptz default now()
);

create table if not exists study_mode_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  has_seen_briefing boolean default false,
  selected_exam text,
  selected_word_tier text not null default 'core' check (selected_word_tier in ('core', 'full')),
  exam_label text,
  days_to_exam int default 0,
  administrative_power int default 0,
  base_administrative_power int default 0,
  vocabulary_gdp int default 0,
  baseline_wpm int default 0,
  skill_balance jsonb default '{"listening":0,"speaking":0,"reading":0,"writing":0}'::jsonb,
  review_deficit int default 0,
  laws jsonb default '{"morningReading":false,"deficitFreeze":false,"nightReview":false,"focusBudget":false}'::jsonb,
  active_buffs jsonb default '{"memoryRate":0,"reviewEfficiency":0,"focusRate":0,"gdpBonus":0}'::jsonb,
  gdp_history jsonb default '[]'::jsonb,
  last_briefing_at timestamptz,
  updated_at timestamptz default now()
);

create table if not exists study_mode_events (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  event_type text not null,
  source text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);


-- 兼容旧数据库：create table if not exists 不会给已有表自动补列，所以这里显式补齐战略模式字段。
alter table study_mode_profiles add column if not exists has_seen_briefing boolean default false;
alter table study_mode_profiles add column if not exists selected_exam text;
alter table study_mode_profiles add column if not exists exam_label text;
alter table study_mode_profiles add column if not exists days_to_exam int default 0;
alter table study_mode_profiles add column if not exists administrative_power int default 0;
alter table study_mode_profiles add column if not exists base_administrative_power int default 0;
alter table study_mode_profiles add column if not exists base_assets int default 0;
alter table study_mode_profiles add column if not exists session_gains numeric default 0;
alter table study_mode_profiles add column if not exists last_session_gain numeric default 0;
alter table study_mode_profiles add column if not exists has_ssa_exchange boolean default false;
alter table study_mode_profiles add column if not exists vocabulary_gdp int default 0;
alter table study_mode_profiles add column if not exists baseline_wpm int default 0;
alter table study_mode_profiles add column if not exists skill_balance jsonb default '{"listening":0,"speaking":0,"reading":0,"writing":0}'::jsonb;
alter table study_mode_profiles add column if not exists review_deficit int default 0;
alter table study_mode_profiles add column if not exists laws jsonb default '{"morningReading":false,"deficitFreeze":false,"nightReview":false,"focusBudget":false}'::jsonb;
alter table study_mode_profiles add column if not exists active_buffs jsonb default '{"memoryRate":0,"reviewEfficiency":0,"focusRate":0,"gdpBonus":0}'::jsonb;
alter table study_mode_profiles add column if not exists gdp_history jsonb default '[]'::jsonb;
alter table study_mode_profiles add column if not exists last_briefing_at timestamptz;
alter table study_mode_profiles add column if not exists updated_at timestamptz default now();
alter table study_mode_profiles drop column if exists strategy_last_changed_at;
alter table study_mode_profiles drop column if exists strategy_locked_until;
alter table words add column if not exists tier text not null default 'full' check (tier in ('core', 'full'));
alter table words add column if not exists stability float not null default 1;
alter table words add column if not exists difficulty float not null default 1.5;
alter table words add column if not exists last_review bigint not null default 0;
alter table words add column if not exists next_review bigint not null default 0;
alter table word_records add column if not exists stability   float  not null default 1;
alter table word_records add column if not exists difficulty  float  not null default 1.5;
alter table word_records add column if not exists last_review bigint not null default 0;
alter table word_records add column if not exists next_review bigint not null default 0;
create index if not exists idx_word_records_user_next_review on word_records (user_id, next_review);
create index if not exists idx_words_category_tier on words(category, tier);
create index if not exists idx_words_next_review on words(next_review);
create index if not exists idx_study_mode_events_user_time on study_mode_events(user_id, created_at desc);
create index if not exists idx_quiz_records_user_time on quiz_records(user_id, created_at desc);
create index if not exists idx_essays_user_time on essays(user_id, created_at desc);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

alter table profiles enable row level security;
alter table quiz_records enable row level security;
alter table word_records enable row level security;
alter table essays enable row level security;
alter table questions enable row level security;
alter table words enable row level security;
alter table study_mode_profiles enable row level security;
alter table study_mode_events enable row level security;

drop policy if exists "用户只能读写自己的数据" on profiles;
drop policy if exists "用户只能读写自己的做题记录" on quiz_records;
drop policy if exists "用户只能读写自己的单词记录" on word_records;
drop policy if exists "用户只能读写自己的作文" on essays;
drop policy if exists "题目所有人可读" on questions;
drop policy if exists "单词所有人可读" on words;
drop policy if exists "认证用户可更新单词复习数据" on words;
drop policy if exists "用户只能读写自己的战情档案" on study_mode_profiles;
drop policy if exists "用户只能读写自己的战情事件" on study_mode_events;
drop policy if exists "anon 可读写单词记录" on word_records;
drop policy if exists "anon 可读写做题记录" on quiz_records;
drop policy if exists "anon 可读写作文" on essays;
drop policy if exists "anon 可读写战情档案" on study_mode_profiles;
drop policy if exists "anon 可读写战情事件" on study_mode_events;

-- NOTE: This app uses custom JWT auth (not Supabase Auth), so auth.uid() is always null.
-- RLS policies that rely on auth.uid() silently block all writes from the anon key.
-- User isolation is enforced at the application layer (user_id is always passed explicitly).
-- These permissive policies allow the anon key to read/write all rows; the API routes
-- and server-side logic are responsible for ensuring users only access their own data.
create policy "用户只能读写自己的数据" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "anon 可读写单词记录" on word_records for all using (true) with check (true);
create policy "anon 可读写做题记录" on quiz_records for all using (true) with check (true);
create policy "anon 可读写作文" on essays for all using (true) with check (true);
create policy "题目所有人可读" on questions for select using (true);
create policy "单词所有人可读" on words for select using (true);
create policy "认证用户可更新单词复习数据" on words for update using (true) with check (true);
create policy "anon 可读写战情档案" on study_mode_profiles for all using (true) with check (true);
create policy "anon 可读写战情事件" on study_mode_events for all using (true) with check (true);

create or replace function get_study_mode_7d_trends(target_user uuid)
returns table (
  day text,
  quiz_attempts int,
  essay_submissions int,
  events int,
  avg_quiz_accuracy numeric,
  gdp_gain int
)
language sql
security definer
set search_path = public
as $$
  with days as (
    select generate_series(current_date - interval '6 days', current_date, interval '1 day')::date as day
  ),
  quiz as (
    select created_at::date as day,
           count(*)::int as quiz_attempts,
           round(avg(case when is_correct then 1 else 0 end) * 100, 2) as avg_quiz_accuracy
    from quiz_records
    where user_id = target_user
      and created_at >= current_date - interval '6 days'
    group by 1
  ),
  essay as (
    select created_at::date as day,
           count(*)::int as essay_submissions
    from essays
    where user_id = target_user
      and created_at >= current_date - interval '6 days'
    group by 1
  ),
  event_base as (
    select created_at::date as day,
           count(*)::int as events,
           coalesce(sum(case when event_type = 'essay_completion' then coalesce((payload->>'gdpGain')::int, 0) else 0 end), 0)::int as gdp_gain
    from study_mode_events
    where user_id = target_user
      and created_at >= current_date - interval '6 days'
    group by 1
  )
  select to_char(days.day, 'MM-DD') as day,
         coalesce(quiz.quiz_attempts, 0) as quiz_attempts,
         coalesce(essay.essay_submissions, 0) as essay_submissions,
         coalesce(event_base.events, 0) as events,
         quiz.avg_quiz_accuracy,
         coalesce(event_base.gdp_gain, 0) as gdp_gain
  from days
  left join quiz on quiz.day = days.day
  left join essay on essay.day = days.day
  left join event_base on event_base.day = days.day
  order by days.day;
$$;

create or replace function get_study_mode_type_win_rates(target_user uuid)
returns table (
  category text,
  quiz_type text,
  attempts int,
  wins int,
  win_rate numeric
)
language sql
security definer
set search_path = public
as $$
  select q.category,
         q.type as quiz_type,
         count(*)::int as attempts,
         sum(case when qr.is_correct then 1 else 0 end)::int as wins,
         round(avg(case when qr.is_correct then 1 else 0 end) * 100, 2) as win_rate
  from quiz_records qr
  join questions q on q.id = qr.question_id
  where qr.user_id = target_user
  group by q.category, q.type
  order by attempts desc, q.category, q.type;
$$;

create or replace function get_study_mode_law_roi(target_user uuid)
returns table (
  law_key text,
  toggle_count int,
  currently_active boolean,
  estimated_memory_bonus_pct numeric,
  estimated_review_efficiency_pct numeric,
  estimated_focus_bonus_pct numeric,
  estimated_gdp_bonus_pct numeric
)
language sql
security definer
set search_path = public
as $$
  with law_events as (
    select payload->>'lawKey' as law_key,
           count(*)::int as toggle_count
    from study_mode_events
    where user_id = target_user
      and event_type = 'law_toggled'
    group by 1
  ),
  profile as (
    select laws, active_buffs
    from study_mode_profiles
    where user_id = target_user
  ),
  keys as (
    select unnest(array['morningReading','deficitFreeze','nightReview','focusBudget'])::text as law_key
  )
  select keys.law_key,
         coalesce(law_events.toggle_count, 0) as toggle_count,
         coalesce((profile.laws ->> keys.law_key)::boolean, false) as currently_active,
         case when keys.law_key = 'morningReading' and coalesce((profile.laws ->> keys.law_key)::boolean, false) then 15 else 0 end as estimated_memory_bonus_pct,
         case when keys.law_key = 'deficitFreeze' and coalesce((profile.laws ->> keys.law_key)::boolean, false) then 18 else 0 end as estimated_review_efficiency_pct,
         case when keys.law_key = 'nightReview' and coalesce((profile.laws ->> keys.law_key)::boolean, false) then 12 else 0 end as estimated_focus_bonus_pct,
         case when keys.law_key = 'focusBudget' and coalesce((profile.laws ->> keys.law_key)::boolean, false) then 10 else 0 end as estimated_gdp_bonus_pct
  from keys
  left join law_events on law_events.law_key = keys.law_key
  cross join profile;
$$;



