-- 관리자가 수동으로 차단한 사용자의 카카오 고유 ID를 영구 보관한다.
-- profiles 행이 나중에 탈퇴/삭제되어도 이 테이블은 그대로 남아있어야
-- 같은 카카오 계정으로의 재가입을 계속 막을 수 있다 (profiles FK로 묶지 않는 이유).

create table public.blocked_kakao_users (
  kakao_user_id text primary key,
  reason text not null,
  blocked_by uuid references public.profiles (id) on delete set null,
  blocked_at timestamptz not null default now()
);

alter table public.blocked_kakao_users enable row level security;
-- select/insert/update 정책을 두지 않는다: 관리자 서버 액션이 항상 admin(service role)
-- 클라이언트로만 접근하므로, anon/authenticated는 이 테이블에 전혀 접근할 수 없다.

-- bank_accounts.reviewed_by는 on delete 옵션이 없어(기본 NO ACTION) 심사했던 관리자의
-- 계정이 탈퇴/삭제되면 FK 위반으로 실패한다. 심사자 참조는 없어져도 무방하므로 set null로 바꾼다.
alter table public.bank_accounts drop constraint if exists bank_accounts_reviewed_by_fkey;
alter table public.bank_accounts
  add constraint bank_accounts_reviewed_by_fkey
  foreign key (reviewed_by) references public.profiles (id) on delete set null;
