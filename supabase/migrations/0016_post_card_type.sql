-- 판매/구매 게시판 하위 분류: 완덱(deck) / 낱장(single)

alter table public.posts
  add column card_type text not null default 'single' check (card_type in ('deck', 'single'));

create index posts_board_type_card_type_created_at_idx
  on public.posts (board_type, card_type, created_at desc);
