-- Helpful for personal analytics queries
create index if not exists stances_user_time_idx     on public.stances (user_id, updated_at desc);
create index if not exists stances_question_time_idx on public.stances (question_id, updated_at desc);