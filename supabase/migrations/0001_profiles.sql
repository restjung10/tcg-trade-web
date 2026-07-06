-- Phase 1: 카카오 로그인용 profiles 테이블

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  kakao_user_id text not null unique,
  nickname text not null unique check (char_length(nickname) between 2 and 12),
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  onboarded boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_public"
  on public.profiles for select
  using (true);

create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- insert는 아래 handle_new_user 트리거(SECURITY DEFINER)만 수행하며,
-- 클라이언트가 직접 insert 할 수 있는 정책은 의도적으로 두지 않는다.

-- role/kakao_user_id/deleted_at은 본인이 update 정책을 통과하더라도 값 변경을 막는다 (권한 상승 방지).
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    new.role := old.role;
    new.kakao_user_id := old.kakao_user_id;
    new.deleted_at := old.deleted_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger protect_profile_privileged_columns
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

-- auth.users에 새 사용자가 생기면 즉시 임시 프로필을 생성한다.
-- Kakao가 raw_user_meta_data에 저장하는 고유 ID 키 이름이 provider_id인지 sub인지
-- 문서상 확정되지 않아 방어적으로 coalesce 처리했다.
-- 실제 로그인 테스트 후 auth.users.raw_user_meta_data를 조회해 값이 비어있지 않은지 반드시 확인할 것.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kakao_id text;
begin
  v_kakao_id := coalesce(
    new.raw_user_meta_data ->> 'provider_id',
    new.raw_user_meta_data ->> 'sub'
  );

  insert into public.profiles (id, kakao_user_id, nickname, avatar_url, onboarded)
  values (
    new.id,
    v_kakao_id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 8),
    new.raw_user_meta_data ->> 'avatar_url',
    false
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
