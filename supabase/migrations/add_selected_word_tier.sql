-- Add selected_word_tier to study_mode_profiles
alter table study_mode_profiles add column if not exists selected_word_tier text not null default 'core' check (selected_word_tier in ('core', 'full'));
