-- sync_kakao_identity가 실제로 auth.identities를 잘 찾는지 진단하기 위해
-- 명시적 user_id 파라미터를 받을 수 있도록 변경한다 (기본값은 auth.uid()로 기존 호출부 호환 유지).

drop function if exists public.sync_kakao_identity();

create or replace function public.sync_kakao_identity(p_user_id uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kakao_id text;
begin
  if p_user_id is null then
    return;
  end if;

  select provider_id into v_kakao_id
  from auth.identities
  where user_id = p_user_id and provider = 'kakao'
  limit 1;

  if v_kakao_id is not null then
    update public.profiles
    set kakao_user_id = v_kakao_id
    where id = p_user_id and kakao_user_id is distinct from v_kakao_id;
  end if;
end;
$$;

grant execute on function public.sync_kakao_identity(uuid) to authenticated, service_role;
