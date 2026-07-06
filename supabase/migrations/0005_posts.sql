-- Phase 2: 게시판(판매/구매) CRUD

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  board_type text not null check (board_type in ('sell', 'buy')),
  title text not null check (char_length(title) between 2 and 100),
  content text not null check (char_length(content) between 1 and 5000),
  price integer check (price is null or price >= 0),
  status text not null default 'trading' check (status in ('trading', 'reserved', 'completed')),
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_board_type_created_at_idx on public.posts (board_type, created_at desc);

alter table public.posts enable row level security;

create policy "posts_select_public"
  on public.posts for select
  using (true);

create policy "posts_insert_own"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "posts_update_own"
  on public.posts for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "posts_delete_own"
  on public.posts for delete
  using (auth.uid() = author_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- 작성자가 아닌 조회자도 조회수를 올릴 수 있어야 하므로,
-- 일반 update RLS 대신 SECURITY DEFINER 함수로만 view_count를 증가시킨다.
create or replace function public.increment_post_view(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set view_count = view_count + 1 where id = p_post_id;
end;
$$;

grant execute on function public.increment_post_view(uuid) to anon, authenticated;
