-- Phase 4: 1:1 채팅

create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  buyer_last_read_at timestamptz not null default now(),
  seller_last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (post_id, buyer_id)
);

alter table public.chat_rooms enable row level security;

create policy "chat_rooms_select_participant"
  on public.chat_rooms for select
  using (auth.uid() in (buyer_id, seller_id));

create policy "chat_rooms_insert_as_buyer"
  on public.chat_rooms for insert
  with check (auth.uid() = buyer_id and buyer_id <> seller_id);

-- update 정책은 두지 않는다. 읽음 처리는 아래 mark_chat_read 함수로만 수행한다.

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index chat_messages_room_created_idx on public.chat_messages (room_id, created_at);

alter table public.chat_messages enable row level security;

create policy "chat_messages_select_participant"
  on public.chat_messages for select
  using (exists (
    select 1 from public.chat_rooms r
    where r.id = room_id and auth.uid() in (r.buyer_id, r.seller_id)
  ));

create policy "chat_messages_insert_participant"
  on public.chat_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.chat_rooms r
      where r.id = room_id and auth.uid() in (r.buyer_id, r.seller_id)
    )
  );

alter publication supabase_realtime add table public.chat_messages;

create or replace function public.mark_chat_read(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_rooms
  set buyer_last_read_at = case when buyer_id = auth.uid() then now() else buyer_last_read_at end,
      seller_last_read_at = case when seller_id = auth.uid() then now() else seller_last_read_at end
  where id = p_room_id and auth.uid() in (buyer_id, seller_id);
end;
$$;

grant execute on function public.mark_chat_read(uuid) to authenticated;

create view public.chat_room_summaries
with (security_invoker = true)
as
select
  r.id as room_id,
  r.post_id,
  p.title as post_title,
  r.buyer_id,
  r.seller_id,
  buyer.nickname as buyer_nickname,
  seller.nickname as seller_nickname,
  r.buyer_last_read_at,
  r.seller_last_read_at,
  (select m.content from public.chat_messages m where m.room_id = r.id order by m.created_at desc limit 1) as last_message,
  (select m.created_at from public.chat_messages m where m.room_id = r.id order by m.created_at desc limit 1) as last_message_at
from public.chat_rooms r
join public.posts p on p.id = r.post_id
join public.profiles buyer on buyer.id = r.buyer_id
join public.profiles seller on seller.id = r.seller_id;
