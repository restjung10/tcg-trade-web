-- 거래완료를 임의로 바꿀 수 없게, 채팅방 안에서의 실제 거래 절차(계좌 전송 → 입금확인 →
-- 송장전송 → 수령확인)를 거쳐야만 게시글이 거래완료로 전환되도록 한다.

create table public.trade_transactions (
  id uuid primary key default gen_random_uuid(),
  chat_room_id uuid not null unique references public.chat_rooms (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  payer_id uuid not null references public.profiles (id) on delete cascade,
  shipper_id uuid not null references public.profiles (id) on delete cascade,
  account_shared_at timestamptz,
  payment_confirmed_at timestamptz,
  tracking_number text,
  shipped_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.trade_transactions enable row level security;

create policy "trade_transactions_select_participant"
  on public.trade_transactions for select
  using (auth.uid() in (payer_id, shipper_id));

-- client용 insert/update 정책은 두지 않는다. 단계 순서/역할 검증이 있는 워크플로라
-- Server Action에서 검증한 뒤 admin(service role) 클라이언트로만 기록한다.

create or replace function public.finalize_trade_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.completed_at is not null and old.completed_at is null then
    update public.posts set status = 'completed' where id = new.post_id;
  end if;
  return new;
end;
$$;

create trigger finalize_trade_transaction_trigger
  after update on public.trade_transactions
  for each row execute function public.finalize_trade_transaction();

alter publication supabase_realtime add table public.trade_transactions;
