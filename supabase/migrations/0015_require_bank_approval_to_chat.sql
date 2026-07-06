-- 계좌 인증(관리자 승인)이 완료된 사용자만 채팅(채팅방 시작/메시지 전송)을 할 수 있게 한다.
-- 미승인 사용자는 게시글 열람만 가능한 상태로 유지된다.

drop policy if exists "chat_rooms_insert_as_buyer" on public.chat_rooms;
create policy "chat_rooms_insert_as_buyer"
  on public.chat_rooms for insert
  with check (
    auth.uid() = buyer_id
    and buyer_id <> seller_id
    and not public.is_suspended(auth.uid())
    and public.has_approved_bank_account(auth.uid())
  );

drop policy if exists "chat_messages_insert_participant" on public.chat_messages;
create policy "chat_messages_insert_participant"
  on public.chat_messages for insert
  with check (
    auth.uid() = sender_id
    and not public.is_suspended(auth.uid())
    and public.has_approved_bank_account(auth.uid())
    and exists (
      select 1 from public.chat_rooms r
      where r.id = room_id and auth.uid() in (r.buyer_id, r.seller_id)
    )
  );
