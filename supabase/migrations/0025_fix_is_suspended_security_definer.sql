-- is_suspended()/has_approved_bank_account()가 SECURITY DEFINER가 아니라(기본값은 INVOKER)
-- 호출자(authenticated) 권한으로 실행됐다. 0017에서 profiles 컬럼 접근을 제한한 뒤로
-- is_suspended()의 "select suspended_at from profiles" 부분이 permission denied로 깨져,
-- 이 함수를 쓰는 모든 정책(posts_insert_own, chat_rooms_insert_as_buyer,
-- chat_messages_insert_participant, reports_insert_own)이 실패했다. 실제로
-- "게시글 작성 중 오류가 발생했습니다"로 재현됨.
-- has_approved_bank_account()는 본인 계좌는 RLS상 항상 보여서 지금은 우연히 동작하지만
-- 같은 구조적 결함이라 함께 SECURITY DEFINER로 바꾼다.

create or replace function public.is_suspended(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = p_user_id and suspended_at is not null
  );
$$;

revoke all on function public.is_suspended(uuid) from public;
revoke execute on function public.is_suspended(uuid) from anon;
grant execute on function public.is_suspended(uuid) to authenticated;

create or replace function public.has_approved_bank_account(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.bank_accounts
    where user_id = p_user_id and status = 'approved'
  );
$$;

revoke all on function public.has_approved_bank_account(uuid) from public;
revoke execute on function public.has_approved_bank_account(uuid) from anon;
grant execute on function public.has_approved_bank_account(uuid) to authenticated;
