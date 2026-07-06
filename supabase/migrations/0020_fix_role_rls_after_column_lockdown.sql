-- 0017에서 profiles 컬럼 접근을 anon/authenticated에서 id/nickname/created_at으로 제한했는데,
-- bank_accounts/reports의 RLS 정책들이 "이 사용자가 admin인가"를 확인하려고
-- profiles.role을 직접 select하는 서브쿼리를 쓰고 있었다. RLS 정책은 호출자(authenticated)
-- 권한으로 평가되므로, role 컬럼 접근이 막히면서 해당 정책이 permission denied로 깨졌다
-- (실제로 "계좌 등록 중 오류가 발생했습니다"로 재현됨 — 재제출 시 update 정책이 평가되면서 발생).
-- SECURITY DEFINER 함수로 우회해 컬럼 권한과 무관하게 role을 확인할 수 있게 한다.

create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = p_user_id and role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
revoke execute on function public.is_admin(uuid) from anon;
grant execute on function public.is_admin(uuid) to authenticated;

drop policy if exists "bank_accounts_select_own_or_admin" on public.bank_accounts;
create policy "bank_accounts_select_own_or_admin"
  on public.bank_accounts for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "bank_accounts_update_own_or_admin" on public.bank_accounts;
create policy "bank_accounts_update_own_or_admin"
  on public.bank_accounts for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin"
  on public.reports for select
  using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin"
  on public.reports for update
  using (public.is_admin())
  with check (public.is_admin());
