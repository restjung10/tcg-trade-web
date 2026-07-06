-- 마이페이지에서 닉네임을 변경할 수 있게 하되, 월 1회로 제한한다.
-- 온보딩에서 처음 닉네임을 정하는 것(old.onboarded = false 상태의 업데이트)은
-- "변경"이 아니라 최초 설정이므로 이 제한에서 제외한다.

alter table public.profiles add column nickname_changed_at timestamptz;

create or replace function public.enforce_nickname_change_limit()
returns trigger
language plpgsql
as $$
begin
  if new.nickname is distinct from old.nickname
     and auth.role() <> 'service_role'
     and old.onboarded = true then
    if old.nickname_changed_at is not null
       and old.nickname_changed_at > now() - interval '30 days' then
      raise exception 'nickname_change_too_soon';
    end if;
    new.nickname_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger enforce_nickname_change_limit
  before update on public.profiles
  for each row execute function public.enforce_nickname_change_limit();

-- get_my_account_status()에 nickname_changed_at을 추가해, 마이페이지에서
-- "다음 변경 가능일"을 계산할 수 있게 한다. 반환 컬럼 구성이 바뀌므로 drop 후 재생성한다.
drop function if exists public.get_my_account_status();

create function public.get_my_account_status()
returns table (
  onboarded boolean,
  suspended boolean,
  suspension_reason text,
  role text,
  deleted boolean,
  nickname_changed_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    onboarded,
    suspended_at is not null,
    suspension_reason,
    role,
    deleted_at is not null,
    nickname_changed_at
  from public.profiles
  where id = auth.uid();
$$;

revoke all on function public.get_my_account_status() from public;
revoke execute on function public.get_my_account_status() from anon;
grant execute on function public.get_my_account_status() to authenticated;
