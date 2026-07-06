-- 거래 후기/평점 시스템: 거래가 완료된 상대방에 대해서만 평점(1~5)과 코멘트를 남길 수 있다.
-- 당근마켓 매너온도류 신뢰 신호를 게시글/마이페이지에 노출하기 위한 기반.

create table public.trade_reviews (
  id uuid primary key default gen_random_uuid(),
  trade_transaction_id uuid not null references public.trade_transactions (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 300),
  created_at timestamptz not null default now(),
  unique (trade_transaction_id, reviewer_id)
);

create index trade_reviews_reviewee_idx on public.trade_reviews (reviewee_id);

alter table public.trade_reviews enable row level security;

-- 후기는 다른 중고거래 플랫폼처럼 공개 신뢰 신호로 쓰이므로 select는 공개한다.
create policy "trade_reviews_select_public"
  on public.trade_reviews for select
  using (true);

-- 실제로 거래가 완료된(trade_transactions.completed_at) 거래의 두 당사자만,
-- 서로에 대해서만(자기 자신 제외) 후기를 남길 수 있다. update/delete 정책은 두지 않는다(후기는 불변).
create policy "trade_reviews_insert_participant"
  on public.trade_reviews for insert
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.trade_transactions t
      where t.id = trade_transaction_id
        and t.completed_at is not null
        and (
          (t.payer_id = auth.uid() and t.shipper_id = reviewee_id)
          or (t.shipper_id = auth.uid() and t.payer_id = reviewee_id)
        )
    )
  );

-- 게시글 목록/마이페이지 등에서 "거래 N회 · 평점 4.8" 식으로 보여줄 집계 뷰.
create view public.profile_trust_stats
with (security_invoker = true)
as
select
  reviewee_id as profile_id,
  count(*) as review_count,
  round(avg(rating)::numeric, 1) as avg_rating
from public.trade_reviews
group by reviewee_id;
