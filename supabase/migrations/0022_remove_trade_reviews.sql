-- 거래 후기/평점 기능을 제거한다 (사용자 판단으로 스코프 아웃).

drop view if exists public.profile_trust_stats;
drop table if exists public.trade_reviews;
