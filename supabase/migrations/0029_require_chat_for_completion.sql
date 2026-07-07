-- 시세조작 악용 방지: 작성자가 게시글을 "거래완료"로 직접 바꾸려면 그 게시글에
-- 채팅방이 1건 이상 있어야 한다(=실제로 거래를 시도한 사람이 있었어야 함).
-- service_role(트리거로 자동 완료되는 lib/actions/tradeTransaction.ts의
-- finalize_trade_transaction 경로 등)은 이 검사를 건너뛴다.

create or replace function public.enforce_completion_requires_chat()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed'
     and old.status is distinct from 'completed'
     and auth.role() <> 'service_role' then
    if not exists (select 1 from public.chat_rooms where post_id = new.id) then
      raise exception 'completion_requires_chat';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_completion_requires_chat
  before update on public.posts
  for each row execute function public.enforce_completion_requires_chat();
