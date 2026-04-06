-- 用户学习进度表
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  nickname text,
  created_at timestamptz default now()
);

-- 题目表
-- category: 'cet4' | 'cet6' | 'kaoyan1' | 'kaoyan2'
-- type 四六级: 'writing' | 'listening_news' | 'listening_interview' | 'listening_passage'
--            | 'reading_match' | 'reading_choice' | 'reading_cloze' | 'translation'
-- type 考研:  'cloze' | 'reading' | 'new_type_match' | 'new_type_summary'
--            | 'translation' | 'writing_small' | 'writing_big'
create table if not exists questions (
  id serial primary key,
  category text not null,
  type text not null,
  passage text,           -- 阅读原文 / 完形填空原文
  content text not null,  -- 题干
  options jsonb,          -- ["A. ...", "B. ...", "C. ...", "D. ..."]
  answer text not null,
  explanation text,
  difficulty int default 2, -- 1简单 2中等 3困难
  created_at timestamptz default now()
);

-- 用户做题记录
create table if not exists quiz_records (
  id serial primary key,
  user_id uuid references profiles(id) on delete cascade,
  question_id int references questions(id),
  user_answer text,
  is_correct boolean,
  created_at timestamptz default now()
);

-- 单词表
create table if not exists words (
  id serial primary key,
  word text not null,
  phonetic text,
  meaning text not null,
  example text,
  category text -- 'cet4' | 'cet6' | 'kaoyan'
);

-- 用户单词记忆状态
create table if not exists word_records (
  id serial primary key,
  user_id uuid references profiles(id) on delete cascade,
  word_id int references words(id),
  status text default 'new', -- 'new' | 'learning' | 'known'
  updated_at timestamptz default now(),
  unique(user_id, word_id)
);

-- 作文表
create table if not exists essays (
  id serial primary key,
  user_id uuid references profiles(id) on delete cascade,
  category text, -- 'cet4' | 'cet6' | 'kaoyan'
  title text,
  content text not null,
  score int,
  feedback text,
  created_at timestamptz default now()
);

-- 自动创建 profile
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- RLS 策略
alter table profiles enable row level security;
alter table quiz_records enable row level security;
alter table word_records enable row level security;
alter table essays enable row level security;

create policy "用户只能读写自己的数据" on profiles for all using (auth.uid() = id);
create policy "用户只能读写自己的做题记录" on quiz_records for all using (auth.uid() = user_id);
create policy "用户只能读写自己的单词记录" on word_records for all using (auth.uid() = user_id);
create policy "用户只能读写自己的作文" on essays for all using (auth.uid() = user_id);
create policy "题目所有人可读" on questions for select using (true);
create policy "单词所有人可读" on words for select using (true);

