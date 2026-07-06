-- Supabase는 public 스키마에 새 함수가 생기면 기본 권한 설정(ALTER DEFAULT PRIVILEGES)에 따라
-- anon/authenticated에게도 EXECUTE 권한을 자동 부여한다 (Postgres의 PUBLIC 자동 부여와는 별개).
-- 0017에서 "from public"만 회수하고 anon을 명시적으로 revoke하지 않아, 로그인하지 않은
-- anon 키로도 get_my_account_status()가 호출 가능한 상태였다 (결과는 auth.uid()가 null이라
-- 빈 배열이 나오긴 하지만, 의도한 authenticated 전용 접근이 아니었다).

revoke execute on function public.get_my_account_status() from anon;
