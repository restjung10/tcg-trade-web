-- Phase 5: 계좌인증 스캐폴딩

create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  bank_name text not null,
  account_number_encrypted text not null,
  account_holder_name text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bank_accounts enable row level security;

create policy "bank_accounts_select_own_or_admin"
  on public.bank_accounts for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "bank_accounts_insert_own"
  on public.bank_accounts for insert
  with check (user_id = auth.uid());

create policy "bank_accounts_update_own_or_admin"
  on public.bank_accounts for update
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 본인이 계좌 정보를 직접 수정하면(관리자가 아니면) 검증 상태를 pending으로 리셋하고
-- 검토 관련 컬럼을 비워 재검토가 필요하도록 강제한다. user_id는 누구도 바꿀 수 없다.
create or replace function public.protect_bank_account_review_columns()
returns trigger
language plpgsql
as $$
begin
  new.user_id := old.user_id;
  new.updated_at := now();
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    new.status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.rejection_reason := null;
  end if;
  return new;
end;
$$;

create trigger protect_bank_account_review_columns
  before update on public.bank_accounts
  for each row execute function public.protect_bank_account_review_columns();
