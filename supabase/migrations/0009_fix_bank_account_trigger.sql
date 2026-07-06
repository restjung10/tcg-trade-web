-- Phase 5 수정: 관리자 role을 가진 사용자가 "본인" 계좌를 재제출할 때도
-- 심사 상태가 pending으로 리셋되어야 하는데, role만으로 분기해서 리셋이 안 되던 문제 수정.
-- role이 아니라 "이 행의 소유자 본인이 수정하는지" 여부로 분기한다.
-- (소유자가 아닌데 update가 허용된 경우는 RLS상 반드시 admin이므로 review 컬럼을 그대로 둔다.)

create or replace function public.protect_bank_account_review_columns()
returns trigger
language plpgsql
as $$
begin
  new.user_id := old.user_id;
  new.updated_at := now();
  if auth.uid() = old.user_id then
    new.status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.rejection_reason := null;
  end if;
  return new;
end;
$$;
