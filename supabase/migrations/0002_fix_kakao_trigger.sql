-- Phase 1 수정: kakao_user_id를 auth.users 트리거 시점이 아니라
-- 로그인 콜백에서 auth.identities를 조회해 채워넣는 방식으로 변경한다.
-- (raw_user_meta_data에는 provider_id/sub 키가 들어오지 않아 NOT NULL 제약 위반으로
--  "Database error saving new user"가 발생했던 문제를 해결)

alter table public.profiles alter column kakao_user_id drop not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, kakao_user_id, nickname, avatar_url, onboarded)
  values (
    new.id,
    null,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 8),
    new.raw_user_meta_data ->> 'avatar_url',
    false
  );

  return new;
end;
$$;

-- 로그인한 본인의 kakao identity(provider_id)를 profiles.kakao_user_id에 동기화한다.
-- auth.identities는 GoTrue 트랜잭션이 완전히 commit된 뒤에 조회하므로 타이밍 문제가 없다.
create or replace function public.sync_kakao_identity()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_kakao_id text;
begin
  if v_uid is null then
    return;
  end if;

  select provider_id into v_kakao_id
  from auth.identities
  where user_id = v_uid and provider = 'kakao'
  limit 1;

  if v_kakao_id is not null then
    update public.profiles
    set kakao_user_id = v_kakao_id
    where id = v_uid and kakao_user_id is distinct from v_kakao_id;
  end if;
end;
$$;

grant execute on function public.sync_kakao_identity() to authenticated;
