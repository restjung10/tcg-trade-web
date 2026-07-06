-- 거래 취소 기능: 계좌 공유 이후 거래가 틀어져도(구매자 잠수 등) 같은 채팅방에서
-- 다시 처음부터 진행할 수 있게 한다.

alter table public.trade_transactions add column cancelled_at timestamptz;
