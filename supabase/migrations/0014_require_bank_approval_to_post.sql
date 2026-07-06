-- 계좌 인증(관리자 승인)이 완료된 사용자만 게시글(판매/구매 모두)을 작성할 수 있게 한다.
-- "가짜/스팸 계정이 아니라 실제 신원(계좌)을 인증한 사람만 글을 쓸 수 있다"는
-- 전체적인 신원 검증 관문으로 사용한다.

create or replace function public.has_approved_bank_account(p_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.bank_accounts
    where user_id = p_user_id and status = 'approved'
  );
$$;

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
  on public.posts for insert
  with check (
    auth.uid() = author_id
    and not public.is_suspended(auth.uid())
    and public.has_approved_bank_account(auth.uid())
  );
