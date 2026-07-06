-- Phase 6 보안 수정: Postgres는 함수 생성 시 기본적으로 PUBLIC에게 EXECUTE 권한을
-- 자동 부여한다. anon/authenticated에서만 revoke하고 PUBLIC에서는 하지 않아서
-- anon/authenticated가 PUBLIC을 통해 여전히 실행할 수 있었다. PUBLIC에서도 회수한다.

revoke execute on function public.increment_post_view(uuid) from public;
