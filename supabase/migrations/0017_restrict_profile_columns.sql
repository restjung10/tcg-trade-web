-- profiles 테이블 select 정책이 using(true)라서, RLS는 행 단위 제어만 하기 때문에
-- anon 키로도 kakao_user_id(카카오 고유 회원번호)/avatar_url(카카오 프로필 사진)/role/
-- suspended_at/suspension_reason/deleted_at까지 누구나 조회 가능한 상태였다 (실제 curl로 재현 확인).
-- 다른 사용자에게 실제로 필요한 건 id/nickname/created_at 뿐이므로 컬럼 단위로 권한을 좁힌다.

revoke select on public.profiles from anon, authenticated;
grant select (id, nickname, created_at) on public.profiles to anon, authenticated;

-- 위 컬럼 제한 때문에 본인 계정 상태(onboarded/정지 여부·사유/권한/탈퇴 여부)를
-- 세션 클라이언트로 직접 select 하던 기존 코드(미들웨어, 로그인 콜백, 정지 안내 페이지,
-- 관리자 권한 체크, 헤더)가 더 이상 동작하지 않는다. 대신 auth.uid() 기준으로만
-- 조회하는 이 함수를 통해서 자기 자신의 상태를 확인한다.
create or replace function public.get_my_account_status()
returns table (
  onboarded boolean,
  suspended boolean,
  suspension_reason text,
  role text,
  deleted boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select onboarded, suspended_at is not null, suspension_reason, role, deleted_at is not null
  from public.profiles
  where id = auth.uid();
$$;

revoke all on function public.get_my_account_status() from public;
grant execute on function public.get_my_account_status() to authenticated;
