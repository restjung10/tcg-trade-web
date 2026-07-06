-- Phase 6: 신고/제재, 검색 고도화 준비

alter table public.profiles add column suspended_at timestamptz;
alter table public.profiles add column suspension_reason text;

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    new.role := old.role;
    new.kakao_user_id := old.kakao_user_id;
    new.deleted_at := old.deleted_at;
    new.suspended_at := old.suspended_at;
    new.suspension_reason := old.suspension_reason;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.is_suspended(p_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles where id = p_user_id and suspended_at is not null
  );
$$;

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
  on public.posts for insert
  with check (auth.uid() = author_id and not public.is_suspended(auth.uid()));

drop policy if exists "chat_rooms_insert_as_buyer" on public.chat_rooms;
create policy "chat_rooms_insert_as_buyer"
  on public.chat_rooms for insert
  with check (auth.uid() = buyer_id and buyer_id <> seller_id and not public.is_suspended(auth.uid()));

drop policy if exists "chat_messages_insert_participant" on public.chat_messages;
create policy "chat_messages_insert_participant"
  on public.chat_messages for insert
  with check (
    auth.uid() = sender_id
    and not public.is_suspended(auth.uid())
    and exists (
      select 1 from public.chat_rooms r
      where r.id = room_id and auth.uid() in (r.buyer_id, r.seller_id)
    )
  );

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (reason in ('fraud', 'ai_image', 'abusive', 'spam', 'other')),
  detail text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

alter table public.reports enable row level security;

create policy "reports_select_own_or_admin"
  on public.reports for select
  using (
    reporter_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "reports_insert_own"
  on public.reports for insert
  with check (reporter_id = auth.uid() and not public.is_suspended(auth.uid()));

create policy "reports_update_admin"
  on public.reports for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
