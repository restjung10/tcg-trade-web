-- Phase 1 수정: 임시 닉네임이 'user_' + 8자 = 13자로 생성되어
-- profiles.nickname의 char_length(nickname) between 2 and 12 체크 제약을 위반하던 문제 수정.
-- 'user_' + 7자 = 12자로 맞춘다.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, kakao_user_id, nickname, avatar_url, onboarded)
  values (
    new.id,
    null,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 7),
    new.raw_user_meta_data ->> 'avatar_url',
    false
  );

  return new;
end;
$$;
