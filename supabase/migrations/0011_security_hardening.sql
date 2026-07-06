-- 보안 강화: 불필요한 권한 회수, Storage 제한, rate limiting

-- (1) increment_post_view는 우리 앱이 항상 admin(service role) 클라이언트로만 호출한다.
-- anon/authenticated에게 열려있을 이유가 없고, 그대로 두면 로그인 없이 REST API로
-- 무한 호출해 조회수를 조작하는 공격 표면이 된다.
revoke execute on function public.increment_post_view(uuid) from anon, authenticated;

-- (2) Storage 버킷 크기/타입 제한을 서버 레벨로 강제한다.
-- 클라이언트 JS 검증은 Storage API 직접 호출로 우회될 수 있다.
update storage.buckets
set file_size_limit = 10485760, -- 10MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'post-images-pending';

-- (3) 공용 rate limit 테이블 + 함수
create table public.rate_limit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  action text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_events_lookup_idx
  on public.rate_limit_events (user_id, action, created_at);

alter table public.rate_limit_events enable row level security;
-- client용 select/insert 정책을 두지 않는다: 아래 SECURITY DEFINER 함수/트리거로만 기록·조회된다.

create or replace function public.check_rate_limit(
  p_action text,
  p_max_count int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_count int;
begin
  if v_uid is null then
    return false;
  end if;

  select count(*) into v_count
  from public.rate_limit_events
  where user_id = v_uid
    and action = p_action
    and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_max_count then
    return false;
  end if;

  insert into public.rate_limit_events (user_id, action) values (v_uid, p_action);
  return true;
end;
$$;

grant execute on function public.check_rate_limit(text, int, int) to authenticated;

-- (4) 채팅 메시지는 Server Action 없이 클라이언트가 직접 insert하므로,
-- Server Action에서만 체크하면 REST API 직접 호출로 우회 가능하다.
-- DB 트리거로 강제해 어떤 경로로 insert하든 적용되게 한다.
create or replace function public.enforce_chat_message_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_count int;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select count(*) into v_count
  from public.rate_limit_events
  where user_id = v_uid
    and action = 'send_message'
    and created_at > now() - interval '60 seconds';

  if v_count >= 30 then
    raise exception '메시지를 너무 자주 보내고 있습니다. 잠시 후 다시 시도해주세요.';
  end if;

  insert into public.rate_limit_events (user_id, action) values (v_uid, 'send_message');
  return new;
end;
$$;

create trigger chat_messages_rate_limit
  before insert on public.chat_messages
  for each row execute function public.enforce_chat_message_rate_limit();
