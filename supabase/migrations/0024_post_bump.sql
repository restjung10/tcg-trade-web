-- 게시물 끌어올리기(하루 1회 제한): 물건이 안 팔리거나 안 구해져서 같은 내용을
-- 새 게시글로 반복 등록하면(이미지 재업로드 포함) 스토리지/egress를 불필요하게
-- 잡아먹으므로, 기존 글을 목록 맨 위로 다시 올릴 수 있는 기능을 제공한다.

alter table public.posts add column bumped_at timestamptz not null default now();

create index posts_board_type_bumped_at_idx on public.posts (board_type, bumped_at desc);

create or replace function public.enforce_post_bump_limit()
returns trigger
language plpgsql
as $$
begin
  if new.bumped_at is distinct from old.bumped_at and auth.role() <> 'service_role' then
    if old.bumped_at > now() - interval '1 day' then
      raise exception 'post_bump_too_soon';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_post_bump_limit
  before update on public.posts
  for each row execute function public.enforce_post_bump_limit();
